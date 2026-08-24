# Strategy History

## 2026-08-16 - Consumer-first pilot exploration

- **Objective:** Find a concrete first target for the autonomous mission runtime.
- **Approach:** Inspect `pmac-emulator` roadmap, active OpenSpec changes, unattended doctor output, worktree state, and current workflow identity.
- **Evidence:** The project had four active changes, unattended readiness blockers, a concurrently changing task file, 80 tracked dirty paths, and thousands of untracked evidence paths; the owner then explicitly removed that repository from the current delivery scope.
- **Outcome:** Abandoned for this change. The kit will use only disposable generic projects.
- **Reason:** A dirty concurrent consumer cannot provide attributable runtime proof, and touching it would violate the accepted kit-only scope.
- **Do-Not-Repeat Condition:** Do not read, index, mutate, or launch a mission in `pmac-emulator` during this change.
- **Evidence-Based Retry Condition:** Only a later explicit owner request that reopens the consumer scope, plus independently green readiness and writer/dirty-state reconciliation.

## 2026-08-16 - Nested OpenCode server per slice

- **Objective:** Give the external roadmap controller a generic executor using existing SDK session APIs.
- **Approach:** Start a fresh `opencode serve` process inside each executor, connect a client, create a grind root, and stop the server after the slice.
- **Evidence:** The installed proof tooling demonstrates server/client creation, but `opencode-pty` keeps its manager and Web UI in the OpenCode plugin runtime. A nested server would therefore own a separate manager and hide its PTYs from the operator's existing cockpit.
- **Outcome:** Rejected.
- **Reason:** It duplicates runtime lifecycle, adds a crash boundary, and violates the accepted requirement that the operator can see every launched terminal in one cockpit.
- **Do-Not-Repeat Condition:** Do not implement or prove a hidden nested-server executor for the interactive mission path.
- **Evidence-Based Retry Condition:** Only if current-runtime session creation becomes unavailable and a supported OpenCode capability can expose and control every nested runtime PTY in the same operator cockpit without a second scheduler or UI.

## 2026-08-16 - Direct launcher PTY with exit notification

- **Objective:** Launch the controller deterministically while letting the parent completion guard wait for terminal notification.
- **Approach:** Call `SHARED_PTY_MANAGER.spawn` directly with `notifyOnExit: true` from the slash launcher.
- **Evidence:** The completion guard attributes awaited PTYs through `pty_spawn` tool leases. A direct manager spawn has no matching `tool.execute` lease, so the guard correctly classifies the live terminal as an unattributed awaited PTY and fails closed.
- **Outcome:** Rejected in favor of launcher-owned correlation with `notifyOnExit: false`.
- **Reason:** Fabricating a guard lease would tightly couple the launcher to guard internals, while asking a model to invoke `pty_spawn` would make deterministic launch depend on model compliance.
- **Do-Not-Repeat Condition:** Do not enable package exit notification for manager-direct campaign PTYs and do not add a synthetic guard lease solely to make that path appear attributed.
- **Evidence-Based Retry Condition:** Only if the shared PTY package exposes a supported non-tool parent-session lease API that the completion guard can consume without new cross-owner coupling.

## 2026-08-16 - Same-runtime executor with existing PTY cockpit

- **Objective:** Keep autonomous slice sessions observable while reusing current kit owners.
- **Approach:** Pass the plugin-provided loopback `serverUrl` to a generic executor, create fresh parentless grind roots on the current server, launch the controller as one shared-manager PTY, and open the existing `/pty-open-background-spy` UI before mutation.
- **Evidence:** `PluginInput` exposes `client`, `directory`, and `serverUrl`; the SDK exposes session create/command APIs; the pinned PTY plugin exposes one shared manager and a Web UI with live output, input, kill, and retained buffers.
- **Outcome:** Selected for proposal, delta spec, design, and tasks.
- **Reason:** This is the smallest composition that keeps all agent PTYs in one cockpit, leaves controller/guard/archive ownership intact, and adds only the missing launcher/executor glue.
- **Do-Not-Repeat Condition:** Do not add a custom dashboard, OS-terminal fan-out, model-driven launcher, second scheduler, archive helper, completion arbiter, or roadmap parser while this approach remains supported.
- **Evidence-Based Retry Condition:** Revisit only if installed same-runtime proof shows a concrete capability, isolation, liveness, or visibility defect that cannot be corrected within the selected owner boundaries.

## 2026-08-16 - Positional operation-gate probing

- **Objective:** Check proposal/apply/archive readiness through the portable operation gate.
- **Approach:** Invoke the gate using guessed positional operation names and `--help`.
- **Evidence:** The CLI returned `Unknown option: apply`, `Unknown option: archive`, and `Unknown option: --help`.
- **Outcome:** Rejected as an invalid invocation strategy, not a product defect.
- **Reason:** The supported contract uses explicit `--root`, `--operation`, and `--change` flags; guessed syntax produced no readiness evidence.
- **Do-Not-Repeat Condition:** Do not retry positional operation names or unsupported help flags.
- **Evidence-Based Retry Condition:** Use only the repository skill's exact canonical command and preserve its exit/stdout/stderr.

## 2026-08-16 - Same-runtime capture with single-pass Windows cleanup

- **Objective:** Prove one installed same-runtime `opsx-apply` root through the real completion guard and structured executor result.
- **Approach:** Start proof-owned loopback provider/OpenCode servers, invoke the production executor once, delete the guard children/root, stop servers, and remove the disposable fixture with one `fs.rmSync` call.
- **Evidence:** `evidence-task-2-1-runtime-r1` records executor exit `0`, `disposition=completed`, `guardState=passed`, `writerClosure=terminal`, one primary and one arbiter call, but cleanup failed with Windows `EBUSY`; the runner then remained alive until the 300-second shell timeout. A correlated process inventory after timeout found no proof process and the named fixture no longer existed.
- **Outcome:** Product lane reached the expected boundary, but the capture is not proof because cleanup/evaluator finalization failed. The live-attempt gate for this lane is blocked pending preserved-bundle replay.
- **Reason:** The runner treated parent process exit as process-tree closure and used a single fixture deletion attempt; Windows shim/descendant and file-handle release timing was not represented in the cleanup contract.
- **Do-Not-Repeat Condition:** Do not rerun the live capture with single-pass fixture removal or without a terminal offline evaluator over `r1`.
- **Evidence-Based Retry Condition:** Add provider-free replay that returns a terminal verdict for `r1`, force-close only the proof-owned Windows process tree after session cleanup, destroy streams, retry bounded fixture removal, remove absolute temp paths from new raw evidence, and prove help/replay make no live calls before recapture.

## 2026-08-16 - Cleanup-evidence recapture unlock

- **Objective:** Close the same-runtime proof cleanup lane without repeating the failed cleanup mechanism.
- **Approach:** Replay `evidence-task-2-1-runtime-r1` offline, then change only proof-runner cleanup to terminate the proof-owned Windows process tree after SDK session deletion, destroy streams, wait for handle release, retry fixture removal, and redact the fixture identity.
- **Evidence:** `evidence-task-2-1-replay-r1/evaluation.json` reached a terminal provider-free verdict with `liveCalls=0`, `productLane=complete`, and exact missing observation `proof-owned process-tree and fixture cleanup terminal completion`. The runner's `--help` and replay paths exit without live calls.
- **Outcome:** A single bounded evidence recapture is unlocked. Its result is not a proof claim unless product, evaluator, session deletion, process-tree cessation, fixture deletion, and evidence cleanup all finish green.
- **Reason:** The preserved bundle proves product behavior and isolates cleanup as the only failed lane; the corrected mechanism can now reach the missing terminal observation.
- **Do-Not-Repeat Condition:** Do not use another flag/timeout-only retry, do not overwrite `r1`, and do not claim task completion from its green product fields.
- **Evidence-Based Retry Condition:** Run one create-new `r2` capture. Any cleanup/finalization failure blocks further live attempts until `r1` and `r2` both replay through the terminal evaluator with a newly identified causal mechanism.

## 2026-08-16 - Propose/apply phase audit race

- **Objective:** Prove one fresh root executes `opsx-propose` and then `opsx-apply` with terminal structured evidence.
- **Approach:** Send both SDK commands sequentially, then wait for completion-guard terminal state only after both command responses.
- **Evidence:** The propose capture produced no terminal output before the 180-second shell timeout and no final bundle. Post-timeout reconciliation found no correlated process or fixture, so the attempt is closed. Source inspection shows the executor can send apply while the propose command's asynchronous grind audit still owns the same root; the runner also had no internal watchdog or durable progress journal.
- **Outcome:** Failed without a product verdict. Another live attempt is blocked until phase ownership is serialized and the runner can preserve the exact stopping stage.
- **Reason:** SDK command completion is not completion-guard terminal completion; treating them as one boundary allowed a same-root audit/command race.
- **Do-Not-Repeat Condition:** Do not send the next phase before a new terminal guard revision for the prior phase, and do not rely on the outer shell timeout for runner finalization.
- **Evidence-Based Retry Condition:** Wait for a changed `lastAuditedRevision` and terminal guard result after each phase, add a bounded child watchdog plus create-new stage journal, prove the runner/help syntax offline, then make one bounded propose evidence capture.

## 2026-08-16 - Runtime proof startup-readiness stagnation

- **Objective:** Obtain terminal propose/apply evidence after serializing phase audits.
- **Approach:** Retry the local runtime capture with per-phase guard waits, a child watchdog, and durable stage journal.
- **Evidence:** `evidence-task-2-2-propose-r2/progress.jsonl` contains only `capture-start`; no `server-ready`, executor stage, process, or fixture remains after timeout. The runner's first SDK readiness request had no abort signal, so its nominal 30-second readiness loop could not advance or finalize. Two propose captures have now produced no terminal candidate evidence.
- **Outcome:** Stagnant. No further propose capture through the same startup mechanism is permitted yet.
- **Reason:** The proof harness, not the executor phase path, can block indefinitely before readiness due to one unbounded SDK request.
- **Do-Not-Repeat Condition:** Do not change only shell timeout, scenario flags, or model text, and do not rerun the mission runtime capture before an independent server-start mechanism is green.
- **Evidence-Based Retry Condition:** Make readiness requests abortable within five seconds, then run the independently supervised installed guard restart preflight to prove local OpenCode server startup/cleanup. Only if that is green may one create-new mission-runtime propose capture test the phase correction.

## 2026-08-16 - Owner-required handoff re-audit loop

- **Objective:** Prove an owner-required mission root persists one handoff, closes ownership, and stops without another model cycle.
- **Approach:** Return a schema-valid `owner_required` arbiter verdict after the synthetic apply command and wait for terminal guard metadata.
- **Evidence:** `evidence-task-2-2-owner-r1/failure.json` records 20 alternating primary/arbiter calls in 30 seconds, final guard state `auditing`, executor terminal result, and complete cleanup. Source tracing shows the synthetic owner handoff sets `guardTurnPending`, but its assistant response clears that flag and the next idle schedules another audit because internal `paused` remains false.
- **Outcome:** Reproduced accepted-scope lifecycle defect. The candidate remains development until corrected and re-proven.
- **Reason:** Owner-required status was persisted as a display/audit state but did not set the existing internal idle-suppression flag used by `scheduleIdle`.
- **Do-Not-Repeat Condition:** Do not retry with another timeout, model response wording, or attempt count while owner-required idle remains eligible for re-audit.
- **Evidence-Based Retry Condition:** Set internal paused state for completion and cycle-budget owner handoff injection, preserve ordinary-human-message resume behavior, pass syntax/provider-free guard checks, then run one create-new local owner-required capture and verify exactly one primary/arbiter pair plus terminal ownership cleanup.

## 2026-08-16 - Owner correction blocked at server readiness

- **Objective:** Re-prove the corrected owner-required lifecycle through the installed local OpenCode loader.
- **Approach:** After green syntax and 35 focused guard tests, run an independent retention preflight followed by one create-new owner-required runtime capture.
- **Evidence:** `evidence-task-2-2-owner-correction-preflight/failure.json` timed out in `session.status` readiness with zero provider calls and complete cleanup. `evidence-task-2-2-owner-r2/{failure.json,progress.jsonl}` failed in the same setup boundary with zero provider calls, no executor, and complete fixture cleanup. Host inspection then found two orphaned `opencode serve` processes whose loopback `/path` responses exactly identified preserved failed proof fixtures `roadmap-runtime-proof-RHst1s` and `guard-restart-proof-retention-preflight-task-2-2-server-preflight-r1`; both parents were absent.
- **Outcome:** Owner correction was not exercised. The two attributable orphaned proof process trees were terminated, their exact disposable fixtures removed, and a follow-up inventory found no remaining `opencode serve` process.
- **Reason:** The immediate failure was server readiness, not owner classification. Whether the two leaked historical proof servers caused the readiness failures is unknown.
- **Do-Not-Repeat Condition:** Do not run another owner-required capture merely because the host is now clean, and do not increase readiness or executor timeouts.
- **Evidence-Based Retry Condition:** With zero orphaned serve processes, run one provider-free installed-loader preflight. If it passes, one bounded owner capture is unlocked; if it fails, preserve cause-rich SDK/server diagnostics before any further server attempt.

## 2026-08-16 - Installed proof environment merged host config and downloaded ripgrep

- **Objective:** Identify why a clean-host disposable OpenCode server remained alive but stopped answering every loopback route during readiness.
- **Approach:** Add body-free bounded `/path` and `/session/status` probes, scalar SDK error-chain facts, and redacted bounded server stream tails; run diagnostic-only loaded-guard preflight captures r3 and r4.
- **Evidence:** r3 recorded both probes aborted, process exit unset, stderr bytes 2874, and zero provider calls. `evidence-task-2-2-owner-readiness-diagnostic-r4/failure.json` then preserved stderr showing host `~/.config/opencode/{config,opencode.*}` loads and `downloading ripgrep` from GitHub before bootstrap stopped after the disposable config load. OpenCode 1.18.18 docs and tagged source confirm config sources merge, `OPENCODE_CONFIG_DIR` does not replace the global source, `Global.Path.config` follows `XDG_CONFIG_HOME`, and ripgrep downloads when neither PATH nor cache contains the binary.
- **Outcome:** Root cause class established; no product/executor/model path ran. Added admitted gate-closer SI-2 and implemented the shared isolated proof-server environment for the two current consumers.
- **Reason:** The runner isolated cache/data/state but not global config/home, inherited custom/inline authority, did not disable update/model-fetch behavior, and hid the already installed cached ripgrep binary from `which`, causing an unnecessary network dependency.
- **Do-Not-Repeat Condition:** Do not run another server with only `OPENCODE_CONFIG_DIR` plus isolated cache, and do not wait longer for the GitHub download.
- **Evidence-Based Retry Condition:** Clear inherited custom/inline config, isolate XDG config and OpenCode test home, disable auto-update/model fetch, expose the readable installed cached ripgrep bin on PATH, keep configured plugins enabled, pass syntax/help, then run one provider-free loaded-guard preflight. Only that green preflight unlocks an owner-required capture.

## 2026-08-16 - Pure diagnostic environment removed the guard under proof

- **Objective:** Re-prove owner-required after isolated server readiness became green.
- **Approach:** Use the new isolated proof-server environment with `OPENCODE_PURE=1` and run owner-required capture r3.
- **Evidence:** `evidence-task-2-2-owner-r3/failure.json` records one primary call, zero arbiter calls, final state `running`, terminal executor cleanup, and no owner verdict. OpenCode 1.18.18 tagged plugin source sets configured external plugins to an empty list when the pure runtime flag is true; the completion guard is a configured external file plugin.
- **Outcome:** The owner guard correction was not exercised. The environment helper now explicitly keeps pure mode off, while XDG config isolation prevents host plugins from loading.
- **Reason:** A flag reused from unrelated proof runners changed the loaded product boundary by disabling the exact plugin under test.
- **Do-Not-Repeat Condition:** Do not use pure mode for completion-guard, PTY bridge, launcher, or other configured-plugin runtime proof.
- **Evidence-Based Retry Condition:** Make the provider-free preflight assert the guard-owned `grind-on` and `grind-off` commands are present, retain isolated config/no-download facts, pass cleanup, then run one create-new owner-required capture.

## 2026-08-16 - Owner pause invalidated its own active audit

- **Objective:** Exercise the corrected owner-required guard under an isolated loaded-plugin runtime.
- **Approach:** After preflight r9 proved `enable-grind`/`disable-grind`, isolated config, no download, and cleanup, run owner-required capture r4.
- **Evidence:** `evidence-task-2-2-owner-r4/failure.json` records exactly one primary and one arbiter call, no owner-handoff primary call, final state `auditing`, and terminal cleanup. Source shows `injectOwnerRequired` set `state.paused = true` before `currentInspection`, while `isCurrentAudit` requires `!state.paused`; injection therefore returned before `promptAsync` and owner status persistence.
- **Outcome:** Reproduced a defect in the first owner-loop correction. The candidate remains development.
- **Reason:** Idle suppression reused the broader paused predicate too early in the active-audit transition.
- **Do-Not-Repeat Condition:** Do not set paused before the final current-inspection/enqueue boundary, and do not let the known synthetic guard assistant revision cancel its owning audit.
- **Evidence-Based Retry Condition:** Mark the guard turn before enqueue, suppress invalidation only for that known guard turn, set paused after successful enqueue, persist owner-required for both explicit and cycle-budget handoffs, pass syntax/focused guard checks, then run one create-new owner capture and evaluator replay.

## 2026-08-16 - Executor revision gate rejected terminal owner state

- **Objective:** Re-prove owner-required after the guard persisted one handoff and stopped re-auditing.
- **Approach:** Run corrected-candidate owner capture r5 and require the executor's terminal guard wait before classification.
- **Evidence:** `evidence-task-2-2-owner-r5/failure.json` records one arbiter call and two primary calls, final guard state `owner-required`, terminal ownership cleanup, and an executor timeout reporting `last=owner-required`. `waitForTerminalGuard` required every terminal state to carry a non-null `lastAuditedRevision`, while the guard only publishes that correlation for `passed`.
- **Outcome:** The guard owner transition is fixed; executor classification remains defective. Candidate stays development.
- **Reason:** A revision gate added to serialize successful propose/apply phases was applied to stopping states that never authorize another phase.
- **Do-Not-Repeat Condition:** Do not require a changed passed-revision from `owner-required`, `paused`, or `error`, and do not weaken the changed-revision requirement for `passed`.
- **Evidence-Based Retry Condition:** Narrow the revision predicate to `passed`, keep stopping states terminal and fail-closed, pass syntax/focused contracts, then run one create-new owner capture and replay its raw bundle through the evaluator without live calls.

## 2026-08-16 - Fresh config dependency reify exceeded readiness

- **Objective:** Exercise the corrected executor revision predicate in owner capture r6.
- **Approach:** Start another isolated loaded-plugin server with a fresh writable config directory and the fixed 30-second readiness bound.
- **Evidence:** `evidence-task-2-2-owner-r6/failure.json` records no executor/provider call, complete cleanup, responsive process with both probes timing out, and logs ending after disposable config load before plugin initialization. OpenCode 1.18.18 `Npm.install` source unconditionally reifies required plugin dependencies when the config directory has no `node_modules`; the kit already contains the exact pinned `global/package.json`, lockfile, and installed tree.
- **Outcome:** Corrected executor was not exercised. Extended SI-2 to seed the disposable config from the existing read-only pinned dependency tree.
- **Reason:** Every create-new config fixture paid a fresh dependency reconciliation before configured plugins could initialize, making startup exceed the unchanged bound.
- **Do-Not-Repeat Condition:** Do not enlarge readiness timeouts or perform another fresh config dependency install/reify.
- **Evidence-Based Retry Condition:** Link the existing pinned `global/node_modules` into the disposable config, copy matching package/lock metadata, preserve isolation/no-download/plugin-control assertions, pass syntax, then run provider-free loaded-guard preflight before one owner capture.

## 2026-08-16 - Unrelated server services kept readiness above the bound

- **Objective:** Re-establish a current continue happy path without increasing the 30-second readiness bound.
- **Approach:** Seed pinned config dependencies and disable built-in default plugins, then measure loaded-guard readiness in preflight r11.
- **Evidence:** `evidence-task-2-2-fast-preflight-r11/raw.json` records loaded guard controls, isolated config, no ripgrep download, complete cleanup, and `readyMs: 30747`, 747 ms above the runtime bound. Logs from prior diagnostics show watcher/service initialization despite those services being outside the executor proof.
- **Outcome:** No product lane ran. Exact remaining overrun is measured and bounded.
- **Reason:** The disposable server still initializes watcher, embedded UI, external-skill, and LSP support that the same-runtime executor scenario neither invokes nor relies on.
- **Do-Not-Repeat Condition:** Do not increase the readiness timeout and do not disable configured external plugins or the command/session APIs under proof.
- **Evidence-Based Retry Condition:** Disable only the supported unrelated watcher, embedded-UI, external-skill, and LSP-download services in the disposable environment, retain configured guard controls/isolation/no-download assertions, and require measured readiness at or below 30 seconds before another product capture.

## 2026-08-16 - Isolated plugin bootstrap varied across the 30-second bound

- **Objective:** Finish the interrupted-root lane after current continue/propose/transient captures proved the product path.
- **Approach:** Reuse the fully isolated, dependency-seeded, unrelated-service-disabled environment under the original 30-second startup bound.
- **Evidence:** preflight r12 measured 22,270 ms and current continue/propose/transient starts completed, but `evidence-task-2-2-interrupted-r1/failure.json` stopped before executor/provider execution with isolated config logs and complete cleanup. No host config, download, default plugin, or fresh dependency mechanism remained reachable.
- **Outcome:** The interrupted product lane did not run. The earlier timeout-only prohibition is superseded by measured isolated local compilation variance and does not govern a shared, progress-bounded startup contract.
- **Reason:** Two runners had different readiness loops and the 30-second proof-start budget overlapped observed local configured-plugin initialization variance; the product command timeout is unrelated and remains 30 seconds.
- **Do-Not-Repeat Condition:** Do not change only one runner's timeout, restore unabortable requests, or weaken loaded-guard/isolation/no-download assertions.
- **Evidence-Based Retry Condition:** Share a 45-second proof-server readiness constant across both runners, use abortable five-second session-status probes, retain the 30-second product command timeout, prove loaded-guard preflight inside 45 seconds, then run one create-new interrupted capture and replay.

## 2026-08-16 - Blind 45-second readiness still ended during isolated plugin initialization

- **Objective:** Prove the shared readiness contract before another interrupted capture.
- **Approach:** Run preflight r13 with isolated dependencies/services, one shared 45-second bound, and abortable status probes.
- **Evidence:** r13 failed with zero provider calls and complete cleanup; cause-rich diagnostics label both probes aborted and show the required isolated config loaded without host config/download before the bound ended. The remaining stage is known local configured-plugin initialization, not an unknown startup or network path.
- **Outcome:** No product lane ran. Blind elapsed time is insufficient to distinguish a stuck server from observed slow local compilation.
- **Reason:** The timeout had no progress milestone; it discarded the causal distinction already present in server logs.
- **Do-Not-Repeat Condition:** Do not retry another single elapsed-time bound or relax product command timeout, config isolation, plugin identity, or cleanup.
- **Evidence-Based Retry Condition:** Require isolated config load within 15 seconds, then allow at most 60 additional seconds for configured plugin readiness, keep five-second abortable probes, fail with the exact stage, prove guard controls/preflight, then run one interrupted capture and replay.

## 2026-08-16 - Interrupted seed was incorrectly declared dormant

- **Objective:** Prove an existing owner-required mission root blocks before a new root or provider call.
- **Approach:** After staged-readiness preflight r14, create one prior proof root with matching `change-a` mission metadata and run interrupted capture r2.
- **Evidence:** r2 executor unexpectedly completed with one primary/arbiter pair instead of blocking; cleanup stages all completed. The outer shell timed out after the runner printed the mismatch, but liveness reconciliation found no correlated runner, executor, server, or fixture. `failure.json` retains only the final result and hashes; the deleted `result.runtime-inspection.json` was not embedded, so whether the root list was empty or metadata/status parsing failed is unobservable.
- **Outcome:** Reproduced a current admission defect or fixture mismatch, with exact cause unknown. Interrupted proof remains blocked.
- **Reason:** The proof runner threw before raw construction and retained hashes rather than bounded diagnostic contents; executor inspection recorded only active refs, not observed root facts.
- **Do-Not-Repeat Condition:** Do not rerun the same interrupted fixture without preserving observed root/status/mission/guard facts, and do not infer the cause from final completion alone.
- **Evidence-Based Retry Condition:** Embed bounded parsed runtime evidence alongside hashes, include observed root summaries in inspection, let mismatch evaluation fail after raw publication, pass syntax/focused contracts, then make one bounded evidence-capture run. Diagnose and replay offline before another proof attempt.

## 2026-08-17 - Root list summaries omitted mission ownership metadata

- **Objective:** Determine why the interrupted r2 seed did not block executor admission.
- **Approach:** Preserve full bounded runtime evidence and observed-root facts, then run diagnostic capture r3.
- **Evidence:** `evidence-task-2-2-interrupted-r3-diagnostic/raw.json` shows one listed prior root with a real session ref but `changeId: null`, `missionId: null`, and `guardState: unknown`; executor then created a second root and completed. The list endpoint supplied a summary without custom metadata, while admission never hydrated it with `session.get`. Provider evidence also showed the unpaused seed could be audited concurrently.
- **Outcome:** Confirmed current admission defect. Candidate remains development; no owner decision is required.
- **Reason:** `inspectRuntime` treated list summaries as full session records, so persisted mission/guard ownership was invisible.
- **Do-Not-Repeat Condition:** Do not infer custom ownership metadata from `v2.session.list` summaries and do not leave an owner-required proof seed internally runnable.
- **Evidence-Based Retry Condition:** Hydrate every non-ignored listed root via `session.get` and fail closed on any detail error; mark the proof seed `paused: true` while retaining `state: owner-required`; pass syntax/focused contracts; then run one interrupted capture and replay expecting zero provider calls, no new root, terminal result, and cleanup.

## 2026-08-17 - Paused mission root was treated as terminal-clear

- **Objective:** Prove hydrated prior mission ownership blocks fresh execution.
- **Approach:** Run interrupted capture r4 after root-detail hydration and an internally paused owner-required seed.
- **Evidence:** r4 raw inspection observes the exact prior session with `changeId: change-a`, `missionId: prior-proof-mission`, and guard state `paused`, but `activeSessionRefs` remains empty; executor then creates a new root and completes. Source exempts both `passed` and `paused` mission roots from active ownership.
- **Outcome:** Confirmed second admission defect. Candidate remains development.
- **Reason:** A paused guard transcript was incorrectly treated as proof of terminal writer closure, which the executor cannot establish from session metadata alone.
- **Do-Not-Repeat Condition:** Do not treat paused/error/owner/unknown expected-change mission roots as terminal-clear without independent closure evidence.
- **Evidence-Based Retry Condition:** Exempt only `passed` expected-change roots, keep busy/retry and pending-question checks, pass syntax/focused contracts, then run one interrupted capture and replay expecting zero provider calls, no executor root, terminal/not-required result, and proof-owned cleanup.

## 2026-08-17 - Current same-runtime executor matrix completed

- **Objective:** Re-establish tasks 2.1/2.2 and admitted SI-1/SI-2 on one current production candidate after the interrupted-root fixes.
- **Approach:** Run serial create-new captures and zero-live replays for continue, propose/apply, owner-required, transient, and interrupted under the staged isolated loaded-guard environment.
- **Evidence:** Replays `evidence-task-2-1-final-replay-r5`, `evidence-task-2-2-propose-final-replay-r5`, `evidence-task-2-2-owner-final-replay-r8`, `evidence-task-2-2-transient-final-replay-r2`, and `evidence-task-2-2-interrupted-replay-r5` all report `status: complete`, `productLane: complete`, `cleanup: complete`, and `liveCalls: 0`. Calls are respectively primary/arbiter 1/1, 2/2, 2/1, 4/0, and 0/0. Process and temp-fixture inventories are empty. Syntax, 35 guard tests, and strict change validation pass.
- **Outcome:** Tasks 2.1, 2.2, SI-1, and SI-2 are complete. Development-stage remains development because accepted launcher/controller/install/qualification scope is still open.
- **Reason:** The final candidate now has exact phase correlation, owner stop, bounded transient handling, hydrated interrupted ownership, deterministic cleanup, isolated startup, and evaluator replay evidence.
- **Do-Not-Repeat Condition:** Do not rerun these lanes unless their product candidate, driven boundary, evaluator, or environment identity is invalidated.
- **Evidence-Based Retry Condition:** Only a scoped invalidation or a reproduced current-scope defect permits an affected-lane rerun; preserve and replay raw evidence first for evaluator-only changes.

## 2026-08-16 - Owner evaluator omitted the handoff call

- **Objective:** Replay the successful owner-required product capture to a terminal offline evaluator verdict.
- **Approach:** Capture owner r7 after seeded loaded-guard preflight, then replay its immutable `raw.json` without live calls.
- **Evidence:** r7 raw records exit 3, `owner-required` disposition/guard/question/error class, terminal writer, complete cleanup, one arbiter call, and two primary calls (command plus rendered owner handoff). Both capture and first replay evaluations reported `blocked` because the evaluator expected only one primary; capture still printed `complete` unconditionally.
- **Outcome:** Product lane is green but evaluator-only correction is required. No additional live attempt is authorized or needed.
- **Reason:** The oracle counted only the command response and did not include the intentionally rendered handoff; it also accepted any nonzero exit for stopping scenarios and did not propagate a blocked evaluation to capture exit status.
- **Do-Not-Repeat Condition:** Do not re-drive OpenCode or weaken owner call/exit/state/cleanup assertions.
- **Evidence-Based Retry Condition:** Require two owner primary calls, exact exit/state/question/error/closure facts, propagate evaluator status to capture exit, pass syntax, then replay the untouched r7 raw bundle to terminal `complete` with `liveCalls: 0`.

## 2026-08-16 - Transient evaluator omitted bounded SDK retries

- **Objective:** Prove provider-transient classification is finite, closes ownership, and replays terminally.
- **Approach:** Run one local 503 simulator capture under the executor's fixed 30-second request bound.
- **Evidence:** `evidence-task-2-2-transient-r1/raw.json` records four primary attempts, zero arbiter calls, exit 1, `transient` disposition/error class, terminal writer, complete cleanup, and no leftover process/fixture. The evaluator expected one primary call and blocked the otherwise exact result.
- **Outcome:** Product lane is green; evaluator-only correction required. No additional live transient attempt is authorized or needed.
- **Reason:** OpenCode/AI-SDK performs a finite retry sequence before the executor abort signal; the original oracle counted only the first request.
- **Do-Not-Repeat Condition:** Do not re-drive the transient provider, alter the product timeout, or accept unbounded/missing cleanup evidence.
- **Evidence-Based Retry Condition:** Require the observed four-call bounded sequence with zero arbiter, exact transient exit/error/closure facts, pass syntax, then replay the untouched r1 raw bundle to `complete` with `liveCalls: 0`.

## 2026-08-17 - Task 1.2 exact-set and ownership preflight completed

- **Objective:** Close the provider-free admission dependency with exact queued-active, Git/checkpoint, lease, process, session, and pending-question evidence before launcher work.
- **Approach:** Extend the existing disposable-repository preflight proof with regular live and unreadable non-file writer leases, and exercise the production same-runtime ownership inspector with deterministic SDK-shaped busy-session, pending-question, and unreadable-session responses. Add the proof CLI's zero-effect `--help` contract while materially changing it.
- **Evidence:** `evidence-task-1-2-r3/evaluation.json` is terminal `complete` with zero project mutations and complete cleanup. Listed clean dormant actives are eligible; missing, unlisted, dirty, overlapping, and ambiguous active sets block; live/unreadable leases and busy/pending/unreadable runtime ownership block as `unknown`. The integrated interrupted-root lane remains current at `evidence-task-2-2-interrupted-r5` and its zero-live-call replay.
- **Outcome:** Accepted. Task 1.2 is complete and the launcher dependency is unblocked.
- **Reason:** The evidence now composes the provider-free definition/OpenSpec/Git/state/lease phase with the production same-runtime process/session/question phase required by design Decision 5, without another model or installed-server attempt.
- **Do-Not-Repeat Condition:** Do not rerun task 1.2 or completed task 2 lanes merely to reconfirm ownership checks.
- **Evidence-Based Retry Condition:** Rerun only when the admission product sources, ownership inspector behavior, proof runner/evaluator, or relevant environment identity changes; use provider-free replay first and re-drive an installed runtime only for an integrated behavior invalidation.

## 2026-08-23 - Paused Behind Claim-Evidence Closure

- **Objective:** Preserve the current mission-runtime candidate while the owner prioritizes universal claim-evidence closure before all other active work.
- **Approach:** Set this change `mutationEnabled=false` without editing production, tasks, or retained evidence. Let `enforce-claim-evidence-closure` own the current loaded instruction and completion-semantics work first.
- **Evidence:** Owner decision on 2026-08-23 explicitly prioritizes complete implementation of `enforce-claim-evidence-closure` before other changes. Process reconciliation found no non-shell mission/change process; the persisted `Apply add-autonomous-roadmap-mission-runtime` session is historical and no live writer was identified.
- **Outcome:** Planning-paused; existing candidate and evidence remain unchanged and attributable.
- **Reason:** Continuing both candidates would invalidate proof and risk overlapping completion semantics without improving the selected outcome.
- **Do-Not-Repeat Condition:** Do not resume mutation or recapture configured-provider evidence while the priority change owns the shared semantics.
- **Evidence-Based Retry Condition:** Resume only after `enforce-claim-evidence-closure` reaches terminal handoff/archive or explicitly transfers the affected owner back, followed by fresh candidate/environment invalidation review.

## 2026-08-24 - Resume after claim-evidence archive

- **Objective:** Restore mutation so task 4.1 can continue after the priority change archived.
- **Approach:** Set `mutationEnabled=true` without changing production bytes in this step.
- **Evidence:** `enforce-claim-evidence-closure` is archived. Task 4.1 live-attempt gate remains separately blocked on capture r2 replay plus isolated ripgrep seeding.
- **Outcome:** Mutation pause lifted. Configured capture is not unlocked by this control change.
- **Reason:** The pause existed only while claim-evidence owned shared completion semantics.
- **Do-Not-Repeat Condition:** Do not treat mutation re-enable as unlock for the blocked configured-capture lane.
- **Evidence-Based Retry Condition:** Follow the capture r2 retry condition before another configured provider capture.

## 2026-08-17 - Compiled OpenCode cannot execute the controller through process.execPath

- **Objective:** Verify the exact controller executable mechanism before an installed launcher capture.
- **Approach:** Inspect the installed OpenCode command and invoke its exact executable with a harmless script-evaluation argument.
- **Evidence:** `Get-Command opencode` resolves `C:\Users\noilw\.bun\bin\opencode.exe` at OpenCode 1.18.18. Invoking that executable with `-e` renders OpenCode CLI usage rather than executing JavaScript; colocated `bun.exe` is present at Bun 1.3.14.
- **Outcome:** The original literal `process.execPath` strategy is rejected for compiled OpenCode. No mission, PTY, provider, or repository mutation was attempted.
- **Reason:** In a compiled OpenCode process, `process.execPath` names the product CLI executable, not a general Node/Bun script runtime.
- **Do-Not-Repeat Condition:** Do not launch `roadmap-mission.ts` directly through a compiled `opencode` executable or fall back to a PATH-selected interpreter.
- **Evidence-Based Retry Condition:** Use `process.execPath` only when its basename is Node/Bun; otherwise require a fixed colocated Bun executable, keep argv/no-shell execution, and prove that exact path through the installed shared-PTY boundary.

## 2026-08-17 - Launcher r1 missing command inventory

- **Objective:** Prove the installed launcher command, cockpit, and harmless shared-manager PTY boundary.
- **Approach:** Start one isolated configured-plugin OpenCode server and wait for all four launcher commands before creating any root or mission PTY.
- **Evidence:** `evidence-task-3-1-launcher-r1/failure.json` records complete cleanup and zero provider calls but only the summary `Launcher commands are not loaded yet`; no command rows or plugin log were retained.
- **Outcome:** Evidence-only failure. Another launcher capture was blocked; no root, cockpit, mission PTY, or project mutation occurred.
- **Reason:** Unknown at r1 because the runner omitted the exact loader observation.
- **Do-Not-Repeat Condition:** Do not repeat a full launcher capture or infer that command row shape is the cause without preserving plugin-load logs and the bounded command inventory.
- **Evidence-Based Retry Condition:** Run one startup-only diagnostic mode that cannot create a root/mission and preserves redacted loader logs, command names, provider-call count, cleanup, and an offline-replayable diagnostic verdict.

## 2026-08-17 - Launcher diagnostic r2 identified runtime origin mismatch

- **Objective:** Acquire the exact command-readiness observation missing from r1 without launching a mission.
- **Approach:** Run the isolated launcher proof in startup-only `diagnose` mode through the full configured-plugin readiness envelope and preserve redacted logs plus command inventory.
- **Evidence:** `evidence-task-3-1-launcher-diagnostic-r2/raw.json` records isolated config loaded, host config absent, bridge commands present, launcher commands absent, zero provider calls, complete cleanup, and exact loader error `OpenCode has no fixed colocated Node/Bun script runtime`.
- **Outcome:** Exact missing observation captured. Product correction required before proof.
- **Reason:** The compiled OpenCode process's internal `process.execPath` is not the original invocation executable; the resolver did not yet inspect the runtime-owned `process.argv[0]` origin whose colocated Bun is available.
- **Do-Not-Repeat Condition:** Do not increase readiness time, change command-row fields, or rerun diagnostic/live capture before offline replay and runtime resolver checks are green.
- **Evidence-Based Retry Condition:** Extend the resolver to only `process.execPath` and `process.argv[0]` origins, prove direct Node/Bun and simulated compiled-OpenCode/colocated-Bun cases offline, replay r2 to terminal diagnostic `complete` with zero live calls, then run one installed launcher capture.

## 2026-08-17 - Launcher r3 omitted the first status text

- **Objective:** Prove the installed slash/cockpit/shared-PTY launcher after the runtime-origin correction and terminal diagnostic replay.
- **Approach:** Run one installed capture, dispatch `/mission-run launcher-proof`, then require a running status before the harmless fixture exits.
- **Evidence:** `evidence-task-3-1-launcher-r3/progress.jsonl` reaches `run-command-returned`; `failure.json` records complete cleanup, zero provider calls, and a 409-character status observation that failed the running predicate. The runner discarded that text and command response instead of publishing partial raw evidence.
- **Outcome:** Evidence-only failure. No further proof attempt is authorized through this path yet.
- **Reason:** Unknown from preserved r3 evidence; the controller may have exited before status or the status oracle may mismatch the observed representation.
- **Do-Not-Repeat Condition:** Do not change timing/predicates or run another proof capture without first preserving the exact first status text and command responses.
- **Evidence-Based Retry Condition:** Run one explicitly non-proof `launch-diagnose` capture that dispatches once, records the immediate status text and command facts without a success predicate, performs complete cleanup with zero provider calls, and supports terminal offline replay. Correct the evidenced cause, replay the diagnostic, then and only then permit one proof capture.

## 2026-08-17 - Launch diagnostic r4 identified virtual Bun executable

- **Objective:** Capture the exact immediate launcher status omitted by r3 without claiming proof.
- **Approach:** Load the corrected launcher, dispatch run and status once, retain command responses/status/logs, then stop before any proof oracle or terminal campaign wait.
- **Evidence:** `evidence-task-3-1-launcher-diagnostic-r4/raw.json` records all four launcher commands, cockpit-confirmed launch path reaching manager spawn, zero provider calls, complete cleanup, and status `Mission command blocked: PTY spawn failed`; the reported runtime basename is `bun` rather than the installed regular `bun.exe`, and no PTY/root correlation was created.
- **Outcome:** Exact r3 observation captured. The runtime-origin inference is insufficient and must be replaced.
- **Reason:** Bun's compiled OpenCode process exposes a virtual/internal Bun-named executable that passed basename checks but could not be spawned by `bun-pty` as a regular host executable.
- **Do-Not-Repeat Condition:** Do not infer script executability from OpenCode process basenames or retry manager spawn with the virtual Bun path.
- **Evidence-Based Retry Condition:** Require an absolute regular Node/Bun executable in launcher plugin options, materialize the installer's verified Node `process.execPath`, pass the proof runner's real Bun executable, validate the tuple, prove direct `bun-pty` spawn offline, replay r4 with zero live calls, then run one installed capture.

## 2026-08-17 - Launcher r5 outer timeout during readiness

- **Objective:** Prove the installed launcher with a configured regular Bun executable after r4 replay and direct PTY-spawn qualification.
- **Approach:** Start the isolated configured-plugin server and proceed only after command inventory reports launcher readiness.
- **Evidence:** The outer command exceeded 240 seconds with only `capture-start`. Process readback found no correlated runner/OpenCode/controller process, but fixture `roadmap-launcher-proof-w9pMc4` remained. Its Git status is clean, it has no mission runtime/evidence files, and its OpenCode log contains only three config-home load records with no session creation. Source inspection shows launcher readiness used an unbounded `client.command.list` request, unlike the abortable five-second readiness calls in the proven runtime runner.
- **Outcome:** Runner/evidence failure before product execution. Writer closure is terminal by process readback; preserved fixture must be serialized before cleanup. Another live attempt is blocked.
- **Reason:** The readiness SDK request could hang before the runner's staged deadline logic regained control.
- **Do-Not-Repeat Condition:** Do not increase the outer timeout, delete the preserved fixture before capture, or issue another installed launcher attempt with an unbounded readiness request.
- **Evidence-Based Retry Condition:** Make command inventory abortable within five seconds, recover/hash/redact the preserved proof-owned fixture to an immutable no-mutation evaluator bundle, remove it only after readback, replay that bundle terminally with zero live calls, then permit one installed capture.

## 2026-08-17 - Launcher r6 status predicate failed after configured runtime

- **Objective:** Prove the launcher after abortable readiness, r5 recovery/replay, configured-runtime validation, and direct PTY spawn proof.
- **Approach:** Run the installed launch and require the first correlated status to show a running controller before its harmless executor exits.
- **Evidence:** `evidence-task-3-1-launcher-r6/progress.jsonl` reaches server readiness and `run-command-returned`; `failure.json` records complete cleanup, zero provider calls, and a 1,491-character status observation that did not contain the required running/cockpit combination. No correlated process or fixture remains.
- **Outcome:** Evidence-only failure. The normal capture still omitted partial text; another proof attempt is blocked.
- **Reason:** Unknown from r6's preserved summary. The now-working PTY spawn may have exited before observation due to controller/preflight execution, or the success representation may differ from the oracle.
- **Do-Not-Repeat Condition:** Do not increase sleeps/timeouts or run normal capture without first obtaining the exact corrected-runtime status text.
- **Evidence-Based Retry Condition:** Run one non-proof `launch-diagnose` capture using the already-qualified mode, preserve and replay its exact status/command/log bundle, then correct only the evidenced controller or evaluator defect before another proof capture.

## 2026-08-17 - Launch diagnostic r7 proved running cockpit PTY

- **Objective:** Recover the exact corrected-runtime status omitted by r6 and classify product versus evaluator behavior.
- **Approach:** Run one non-proof launch diagnostic, dispatch run/status, and retain the full first status without requiring terminal completion.
- **Evidence:** `evidence-task-3-1-launcher-diagnostic-r7/raw.json` records all launcher commands, `visibility: opened`, configured `bun.exe`, hashed root/runtime/PTY refs, `notifyOnExit: false`, PTY `running`, zero provider calls, and complete cleanup.
- **Outcome:** Product launcher happy path is green through visible running controller PTY. The remaining r6 failure is evaluator-only.
- **Reason:** Normal capture issued terminal status once after six seconds and then reread the same immutable no-reply message; it never refreshed status while waiting for exit.
- **Do-Not-Repeat Condition:** Do not use fixed-sleep plus static message reread as a terminal liveness oracle or rerun launch diagnostics.
- **Evidence-Based Retry Condition:** Poll by issuing bounded fresh `/mission-status` commands until terminal state or 20 seconds, preserve partial raw status on any failure, replay r7 terminally with zero live calls, then permit one final proof capture.

## 2026-08-17 - Launcher r8 terminal oracle exceeded task 3.1

- **Objective:** Complete installed task 3.1 proof with fresh bounded status polling and partial raw preservation.
- **Approach:** Observe running status, then issue fresh status commands until both PTY exit and durable paused mission state appeared.
- **Evidence:** `evidence-task-3-1-launcher-r8/raw.json` preserves running cockpit-correlated status followed by PTY exit 1, zero provider calls, and complete cleanup; durable disposition remains `not-started` because the harmless controller fixture exited before its first mission transition.
- **Outcome:** Launcher run/visibility/terminal PTY behavior is present, but the proof oracle incorrectly required task 3.2 durable stop/reconciliation behavior.
- **Reason:** Task 3.1 requires visible PTY, status correlation, manager terminal callback, and toast; it does not require controller lifecycle state or graceful/unknown stop classification.
- **Do-Not-Repeat Condition:** Do not make task 3.1 depend on durable paused state, archive/controller integration, or a successful mission transition.
- **Evidence-Based Retry Condition:** Replay r8 as a terminal evaluator-gap bundle with zero live calls, expose manager terminal-callback/toast facts in launcher status, require running then exited PTY plus callback/toast success, and run one final installed capture.

## 2026-08-17 - Task 3.1 installed launcher completed

- **Objective:** Complete the visible, current-runtime, safe-argument launcher boundary without adding scheduling or stop semantics.
- **Approach:** Run the installed slash command through an isolated OpenCode server, open the real pinned PTY cockpit, launch the canonical controller through the shared manager with a configured regular Bun executable, poll status through PTY exit, and separately challenge traversal, absolute-path, and argv-injection arguments.
- **Evidence:** `evidence-task-3-1-launcher-r9/evaluation.json` and `evidence-task-3-1-launcher-replay-r9/evaluation.json` are `complete`: cockpit opened, runtime/root/PTY refs correlated, `bun.exe` fixed runtime, PTY running then exited, `notifyOnExit: false`, terminal callback observed, toast sent, isolated server, zero provider calls, complete cleanup. `evidence-task-3-1-launcher-reject-r1` and its replay are `complete`: all three unsafe inputs blocked, no cockpit visibility mutation, no mission runtime, zero provider calls, complete cleanup.
- **Outcome:** Accepted. Task 3.1 is complete; task 3.2 stop/reconciliation remains separate.
- **Reason:** The installed operator entry point now proves only launcher-owned responsibilities, while controller lifecycle, graceful stop, hard kill, runtime loss, and durable reconciliation remain correctly deferred.
- **Do-Not-Repeat Condition:** Do not rerun task 3.1 happy/rejection lanes unless launcher/bridge/config/runtime selection, runner/evaluator, or environment identity is invalidated.
- **Evidence-Based Retry Condition:** Apply scoped invalidation; replay preserved raw evidence first for evaluator-only changes and re-drive only the affected installed boundary.

## 2026-08-17 - Graceful-stop r1 blocked in isolated startup

- **Objective:** Prove streamed child output and slash-driven graceful stop through the installed launcher/controller boundary.
- **Approach:** Start the isolated configured-plugin server, then launch a valid long-running harmless controller fixture and stop it after both stream prefixes appear.
- **Evidence:** `evidence-task-3-2-stop-r1/failure.json` records complete cleanup, zero provider calls, no command inventory, abortable command-readiness timeout, and failed `/path` plus `/session/status` probes. Progress never reached server readiness; no root, cockpit, PTY, controller, stop intent, or project mutation was created.
- **Outcome:** Environment/readiness failure before product execution. Another stop capture is blocked.
- **Reason:** Isolated OpenCode initialization did not reach its configured-plugin ready rung within the staged envelope; no stop behavior was observed.
- **Do-Not-Repeat Condition:** Do not increase the outer timeout or attribute the failure to controller/stop code without loaded commands.
- **Evidence-Based Retry Condition:** Run one startup-only `diagnose` capture that preserves redacted loader logs, command inventory, zero provider calls, and cleanup; replay it terminally, then retry the stop lane only if launcher readiness is green or the exact startup cause has been corrected.

## 2026-08-17 - Graceful-stop r3 did not reach executor stream

- **Objective:** Prove installed stream visibility and graceful stop after the startup diagnostic replayed ready.
- **Approach:** Launch the valid long-running fixture and wait up to ten seconds for both prefixed child streams before dispatching stop.
- **Evidence:** `evidence-task-3-2-stop-r3/raw.json` records a running visible PTY but durable `not-started`, zero stream prefixes, zero provider calls, and complete cleanup throughout the bounded observation. No stop command or stop intent was issued.
- **Outcome:** Product stop behavior was not reached; preflight/controller startup remains unclassified. Another installed attempt is blocked.
- **Reason:** Unknown from the installed status alone: exact fixture preflight may be blocked or may exceed the ten-second stream wait.
- **Do-Not-Repeat Condition:** Do not extend the installed stream wait or change stop signaling before measuring exact provider-free fixture preflight.
- **Evidence-Based Retry Condition:** Run the exact fixture through the production preflight CLI without OpenCode/provider/cockpit, preserve all checks and duration with Git/cleanup facts, and correct a reported blocker or use its measured completion bound before another stop attempt.

## 2026-08-17 - Stop preflight r4 found unsupported fixture version

- **Objective:** Classify the pre-stream controller phase without another installed stop attempt.
- **Approach:** Run the exact launcher fixture through the production preflight CLI provider-free and preserve every check plus duration/Git/cleanup facts.
- **Evidence:** `evidence-task-3-2-stop-preflight-r4/raw.json` completes in 991 ms with clean Git and complete cleanup. Every definition, effects, checkpoint, source, overlay, adapter, authority, and lease check passes except `project:openspec-state`, which blocks because the fake emits `OpenSpec 1.2.0`; production requires a line beginning with semantic version `1.6+`.
- **Outcome:** Exact fixture blocker identified; no production correction is required.
- **Reason:** The launcher proof's fake OpenSpec version was stale and incorrectly prefixed, so controller preflight never recorded state or launched the streamed executor.
- **Do-Not-Repeat Condition:** Do not extend installed waits or alter controller stop logic for this failure.
- **Evidence-Based Retry Condition:** Correct the fake to a parseable supported `1.6.0`, obtain provider-free eligible preflight with clean Git/cleanup, replay it with zero live calls, then run one installed stop capture.

## 2026-08-17 - Controller stop r11 showed immediate SIGINT bypassed finalization

- **Objective:** Prove provider-free controller stream visibility and slash-intent graceful stop after lifecycle diagnostic/replay.
- **Approach:** Wait for durable active session and both prefixes, record slash stop intent, then immediately send `SIGINT` to the Windows controller child process.
- **Evidence:** `evidence-task-3-2-controller-stop-r11/raw.json` records both prefixed streams, slash intent, complete cleanup, and controller exit by `SIGINT`, but durable state remains `running` with active session and no report.
- **Outcome:** Reproduced production-protocol defect. Immediate controller signaling can bypass finalization on Windows.
- **Reason:** The durable stop-intent polling path was given no settle opportunity; direct Windows child `SIGINT` terminates the controller before it records session completion/pause.
- **Do-Not-Repeat Condition:** Do not signal the controller immediately after writing stop intent or classify process exit alone as graceful closure.
- **Evidence-Based Retry Condition:** Let stop intent drive primary bounded child shutdown, send PTY Ctrl+C only as a fallback when the controller remains running after 750 ms, prove provider-free intent-only controller pause first, then re-enter the installed slash lane.

## 2026-08-17 - Direct launcher-stop fixture exhausted its resume attempt

- **Objective:** Compose the real launcher hook, pinned PTY manager, controller stream, slash stop, and hard-kill behavior without another slow installed-server bootstrap.
- **Approach:** Run one disposable mission through graceful stop, resume it, then hard-kill its controller PTY under a loopback fake OpenCode API.
- **Evidence:** `evidence-task-3-2-launcher-stop-direct-r3/failure.json` preserves redacted PTY buffers. The run controller records stopped attempt 1 and durable `paused`; resume immediately returns `paused` with no process evidence because the fixture configured `maxAttemptsPerSlice: 1`. Earlier r1/r2 summaries were deleted because they omitted the PTY buffer and exposed raw machine paths.
- **Outcome:** Proof-fixture defect, not production defect. Cleanup was complete and no process or fixture remained.
- **Reason:** A graceful stop still consumes the launched attempt; the fixture left no remaining attempt for the required resume/hard-kill phase.
- **Do-Not-Repeat Condition:** Do not alter production resume semantics, timeout values, or PTY selection for this failure, and do not persist unredacted failure inventory.
- **Evidence-Based Retry Condition:** Give the disposable fixture exactly one additional attempt, preserve redacted PTY buffers on failure, retain bounded cleanup, then rerun the provider-free composition once.

## 2026-08-17 - Unknown mission ownership correctly blocked a second same-project scenario

- **Objective:** Add fresh-runtime loss reconciliation after the cockpit Kill case.
- **Approach:** Hard-kill the first mission to `paused-unknown`, then launch a second mission in the same disposable project before recreating the launcher.
- **Evidence:** `evidence-task-3-2-launcher-stop-direct-r5/failure.json` shows graceful and cockpit-kill phases completed, while the second mission controller returned `blocked` with no executor stream. The first mission still had a preserved unknown active operation, so project admission correctly failed closed. Cleanup was complete and provider calls were zero.
- **Outcome:** Correct production safety behavior; the proof scenarios were not independent.
- **Reason:** Runtime-loss and cockpit-kill cases both intentionally leave unknown ownership, so they cannot run serially in one project without a reconciliation authority that this task must not invent.
- **Do-Not-Repeat Condition:** Do not clear unknown state, weaken project admission, or fabricate reconciliation merely to combine the cases.
- **Evidence-Based Retry Condition:** Run runtime-loss in a second disposable project with independent mission state while retaining the same loopback API and pinned manager, then evaluate both cases together.

## 2026-08-17 - Task 3.2 stop and unknown-reconciliation boundaries completed

- **Objective:** Complete graceful slash stop, child stream visibility, cockpit Kill, runtime-loss reconciliation, and terminal cleanup on the current production candidate.
- **Approach:** Let durable slash stop intent drive executor SIGINT and controller finalization; use bounded PTY Ctrl+C only as fallback; terminate exact proof-owned process trees for hard-kill diagnostics; split streamed process ownership into `controller-process.ts`; then compose the real launcher hook and pinned manager against a provider-free loopback API over independent disposable projects.
- **Evidence:** `evidence-task-3-2-controller-stop-r14` and `evidence-task-3-2-controller-hard-kill-r14` are `complete`, and both zero-call replays are `complete`. `evidence-task-3-2-launcher-stop-direct-r6/evaluation.json` and its replay are `complete`: cockpit requests precede three spawns, both stream prefixes are visible, `notifyOnExit` is false, graceful stop reaches exited/`paused` with active ownership cleared, cockpit Kill reaches killed/`paused-unknown` with active ownership preserved, and recreated-runtime status reaches `paused-unknown` with no in-memory PTY. Provider calls are zero, cleanup is complete, and process/temp-fixture inventories are empty. Focused contracts are 68/68.
- **Outcome:** Accepted. Task 3.2 is complete; task 4.1 is unblocked. Development-stage remains development until the configured-provider one-slice mission proves the integrated product happy path.
- **Reason:** The composed proof covers the controller/process/state and launcher/PTY/runtime-loss owners without relying on the nondeterministic fresh installed-server startup. Installed cockpit loading and launcher spawn remain current from task 3.1, while task 3.2's changed controller path is covered by the real direct hook/manager boundary.
- **Do-Not-Repeat Condition:** Do not rerun the completed 3.2 lanes unless controller/process/state/launcher/bridge behavior, the proof runner/evaluator, or relevant environment identity changes. Do not use immediate Windows controller SIGINT or another installed-startup timeout-only retry.
- **Evidence-Based Retry Condition:** Apply scoped invalidation, replay the affected raw bundle first for evaluator-only changes, and re-drive only the smallest changed boundary. A configured-provider attempt is governed separately by task 4.1 preflight and live-attempt gates.

## 2026-08-17 - Integrated capture r1 lacked an isolated model catalog

- **Objective:** Prove one installed slash-launched, same-runtime, configured-provider `continue` slice through deterministic validation, archive, readback, and local commit.
- **Approach:** Start one isolated OpenCode server with the bridge, completion guard, launcher, selected profile route, copied proof-only auth file, and a disposable one-slice mission; invoke `/mission-run` through the SDK operator root.
- **Evidence:** `evidence-task-4-1-integrated-capture-r1/raw.json` records isolated command readiness, one operator root deleted, complete process/fixture cleanup, no PTY/status or mission state, and OpenCode error ref `err_e35b02d2`. The first runner version omitted server diagnostics. Provider-free reproduction `evidence-task-4-1-integrated-preflight-r4/raw.json` captured the exact server cause `ProviderModelNotFoundError: Model not found: openai/gpt-5.6-sol`; isolated model fetching/cache were disabled, and no provider request or model root occurred. Offline `evidence-task-4-1-integrated-capture-replay-r1` is terminal `blocked` with `liveCalls: 0`.
- **Outcome:** Environment/proof-config failure before the launcher hook or provider call. No production outcome was exercised.
- **Reason:** The proof isolated and disabled model-catalog fetching but did not declare the already-selected profile model in its disposable provider catalog.
- **Do-Not-Repeat Condition:** Do not retry with an empty isolated catalog, enable remote model fetching, merge host config/cache, or infer provider failure from the generic SDK wrapper error.
- **Evidence-Based Retry Condition:** Declare only the selected provider/model id in disposable config, retain copied existing auth without exposing it, preserve redacted server error lines, and prove the slash/controller boundary provider-free before another configured capture.

## 2026-08-17 - Integrated capture r2 hit OpenSpec telemetry before JSON state

- **Objective:** Re-run the one-slice integrated mission after model resolution and handled-command status observation were proven provider-free.
- **Approach:** Use the corrected isolated model catalog, invoke the actual launcher hook, observe the visible controller PTY, and wait for durable completion.
- **Evidence:** `evidence-task-4-1-integrated-capture-r2/raw.json` records visible running then exited controller PTY, exit 1, durable `not-started`, zero stream prefixes, one operator root deleted, complete cleanup, and no executor result/marker/archive. The runner timed out on terminal status. `evidence-task-4-1-integrated-preflight-r3/raw.json` independently observed OpenSpec's first-run stdout prefix `Note: OpenSpec collects anonymous usage stats` before its JSON. Earlier integrated preflights accidentally invoked this direct read before slash launch, while capture did not; production preflight strictly parsed the controller's first `openspec list --json` and exited before its first transition. Offline `evidence-task-4-1-integrated-capture-replay-r2` is terminal `blocked` with `liveCalls: 0`.
- **Outcome:** Reproduced mission-runtime environment defect before model/provider execution. No configured provider call occurred.
- **Reason:** Launcher-owned controllers did not disable OpenSpec telemetry even though missions require no remote effect and machine-readable OpenSpec output.
- **Do-Not-Repeat Condition:** Do not prime OpenSpec with an earlier proof call, strip arbitrary non-JSON output, increase status timeout, or retry before the controller itself proves first-invocation progress.
- **Evidence-Based Retry Condition:** Set `OPENSPEC_TELEMETRY=0` in the launcher-owned controller environment, order provider-free preflight so slash/controller runs before every direct OpenSpec probe, require durable paused state with no model root, and replay both failed configured bundles before another live attempt.

## 2026-08-17 - Structured controller integration and live-attempt unlock completed

- **Objective:** Establish every provider-free dependency and offline replay condition for the next task 4.1 configured-provider attempt.
- **Approach:** Add deterministic result-path/adapter placeholders, bounded regular-file/evidence readback, exact `parseMissionExecutorResult` correlation, disposition mapping, and transient-only retry; split adapter/process/result owners from controller orchestration; run controller campaigns and the installed no-model slash path.
- **Evidence:** `evidence-task-4-1-controller-structured-r3` and its replay are `complete`: correlated completed results reach deterministic validation/archive, unchecked completion is retried, only schema-valid closed-writer transient results retry finitely, two archives/checkpoint modes complete, and protected successor blocks. `evidence-task-4-1-integrated-preflight-r7/evaluation.json` is `complete`: required commands loaded, mission eligible, isolated server, slash/cockpit/controller reaches durable `paused` before any direct OpenSpec probe, no model root exists, and cleanup is complete. Configured r1/r2 replays are terminal `blocked` with zero live calls; no correlated process/temp fixture remains.
- **Outcome:** Configured capture r3 is unlocked. Task 4.1 remains incomplete until its actual model slice, deterministic verification, archive/readback/local commit, and cleanup are green.
- **Reason:** The next attempt now starts beyond both earlier setup failures and exercises structured controller integration only after its provider-free equivalent is current.
- **Do-Not-Repeat Condition:** Do not rerun r1/r2 mechanisms, bypass result files, infer success from process exit/model prose, or mutate the candidate between r7 and the configured capture.
- **Evidence-Based Retry Condition:** Run exactly one create-new r3 capture on this candidate. Any evidence-only or live failure immediately blocks another attempt until r1-r3 preserved replay/finalization is terminal and a new causal mechanism is proven provider-free where reachable.

## 2026-08-17 - Integrated capture r3 reached a terminal executor result but omitted it from failure evidence

- **Objective:** Execute the unlocked configured-provider one-slice mission through the installed launcher and structured controller.
- **Approach:** Use the r7-proven no-priming controller environment, selected isolated model catalog, one controller attempt, finite guard cycles, local commit only, and no remote.
- **Evidence:** `evidence-task-4-1-integrated-capture-r3/raw.json` records the visible controller PTY, 29 prefixed stdout and one stderr line, three proof-owned root sessions deleted, terminal callback/toast, durable `blocked`, active ownership cleared, controller exit 1, complete process/project cleanup, and no residue. The 29 stdout lines match the executor entrypoint's pretty-printed structured-result shape, but the runner copied `result.json` only after a `complete` status and deleted the fixture before preserving its terminal `errorMessage`. `evidence-task-4-1-integrated-capture-replay-r3` is terminal `blocked` with `liveCalls: 0`.
- **Outcome:** Actual provider/runtime lane reached structured terminal classification, but the causal result is unavailable. Task 4.1 remains incomplete and another proof attempt is blocked.
- **Reason:** Proof finalization was success-only; server-log filtering and repeated status messages cannot reconstruct the deleted project result safely.
- **Do-Not-Repeat Condition:** Do not infer the terminal cause, increase timeouts, claim the model failed, or run another proof-mode capture without result/state/PTY failure preservation.
- **Evidence-Based Retry Condition:** Preserve available result/state/repository facts on every outcome, discover the loopback PTY API and capture its bounded plain buffer before cleanup, validate that finalizer offline, replay r1-r3 terminally, then run at most one explicitly non-proof bounded evidence capture to acquire the missing result.

## 2026-08-17 - Integrated failure finalizer validated offline; bounded diagnostic unlocked

- **Objective:** Close the r3 evidence gap without treating another provider call as product proof.
- **Approach:** Add privacy-safe `projectFacts` and loopback PTY API capture, permit the spec-required `Write` and `Apply Patch` tools in the disposable allowlist, suppress repetitive handled-command logs, and exercise finalization with synthetic terminal result/state/marker/PTY facts.
- **Evidence:** `evidence-task-4-1-integrated-finalizer-selftest-r1/evaluation.json` is `complete` with `liveCalls: 0`: terminal result and hashed session ref, blocked state, marker, controller buffer, and cleanup all persist. Configured r1-r3 replays are terminal `blocked`. `evidence-task-4-1-integrated-preflight-r8` was an unrelated known fresh-server startup timeout before command loading; cleanup completed and its startup mechanism must not be repeated without a new causal change. No configured r4 has run.
- **Outcome:** One `--mode diagnose` call is unlocked solely to acquire executor result/state/PTY facts. The diagnostic evaluator is `proof: false` and does not close task 4.1 even if its nested product outcome is green.
- **Reason:** The missing r3 result can only be reacquired through the integrated live path, while the finalization/evaluator chain is now independently green offline.
- **Do-Not-Repeat Condition:** Do not call the diagnostic a proof, do not run another `preflight` through the unchanged fresh-server startup mechanism, and do not schedule a proof-mode successor until the diagnostic raw bundle is replayed and its exact cause is dispositioned.
- **Evidence-Based Retry Condition:** Run one create-new configured `diagnose` bundle, require cleanup plus captured result/state/controller buffer/session deletion, replay it with zero live calls, then either correct and prove the exact defect provider-free where possible or record a product-complete diagnostic as non-proof before deciding whether a final proof attempt is earned.

## 2026-08-17 - Aggregate validation exposed stale launcher fixtures

- **Objective:** Satisfy repository-native validation before archiving the separately completed self-diagnostic change and pushing the owner-requested complete worktree.
- **Approach:** Run the canonical archive helper with `npm run prepush:validate`, inspect its preserved failure output, compare the new roadmap launcher validator contract with the four named positive fixtures, and add only the canonical launcher tuple plus `scriptRuntime` placeholder to those fixtures.
- **Evidence:** Archive PTY `pty_ac0a3baf` stopped before spec sync or movement with project-validation exit `1`. All four failures required `__OPENCODE_CONFIG_DIR__/extensions/roadmap-mission-launcher.ts` as an option tuple in three permission fixtures and the shared portable surface. `tools/validators/opencode-config.ts` and `global/opencode.json.template` already agreed on that exact contract. After fixture correction, `npm run test:focused:library` reports `OK: library tests=151`.
- **Outcome:** Test-fixture consistency is restored without changing production launcher, validator semantics, mission state, provider behavior, or preserved runtime evidence. The self-diagnostic archive retry is unlocked; this roadmap change remains incomplete at its existing task/live-attempt state.
- **Reason:** The launcher validator evolved with the production template while four complete-fixture builders retained the previous plugin inventory.
- **Do-Not-Repeat Condition:** Do not weaken the launcher validator, omit the runtime placeholder, or rerun any configured-provider roadmap lane for this fixture-only correction.
- **Evidence-Based Retry Condition:** Re-run the canonical archive helper's aggregate project validation. Any further failure must be classified from its own diagnostics; green validation authorizes only the requested archive/commit/push flow, not roadmap completion.

## 2026-08-18 - Integrated diagnose r4 repeated the isolated-startup evidence gap

- **Objective:** Acquire the missing r3 executor result, mission state, and controller PTY buffer through one non-proof diagnose.
- **Approach:** Reuse the unchanged fresh isolated `opencode serve` plus `command.list` readiness loop, then run the full diagnose path.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r4/raw.json` records `cleanup: complete`, `deletedRootSessions: 0`, `isolatedConfigLoaded: true`, empty command inventory, aborted `/path` and `/session/status` probes, and no stdout/stderr tails or project facts. Offline `evidence-task-4-1-integrated-diagnose-replay-r4` and `replay-r4b` are terminal `blocked` with `liveCalls: 0`. The failure JSON matches `evidence-task-4-1-integrated-preflight-r8`.
- **Outcome:** Environment/evidence failure before session creation. The isolated-startup lane remains blocked. No provider call or mission mutation occurred.
- **Reason:** `startOpenCode` discarded in-memory server logs and stopped the child before `finally`, so the missing observation is still the bootstrap log tail. Diagnose also still waited only for `durableDisposition=complete`, which would have dropped a blocked product outcome like r3.
- **Do-Not-Repeat Condition:** Do not rerun preflight, diagnose, or capture through an empty-cache isolated serve without preserved stdout/stderr tails, and do not require diagnostic completion to equal product `complete`.
- **Evidence-Based Retry Condition:** Persist the isolated XDG compile cache across fixture deletion, attach child exit/elapsed/log tails to startup failures, make diagnose wait for any controller PTY exit, replay r1-r4 to terminal blocked with zero live calls, then run one create-new diagnose.

## 2026-08-18 - Integrated diagnose unlocked after runner evidence and cache correction

- **Objective:** Close the r3/r4 observation gap without repeating the discarded-log startup mechanism.
- **Approach:** Keep a durable proof-owned XDG cache under the OS temp root, preserve startup stream tails, and treat any controller PTY exit as diagnostic-terminal.
- **Evidence:** `--help` exits 0. `evidence-task-4-1-integrated-finalizer-selftest-r2` is `complete` with `liveCalls: 0`. Configured r1-r3 and diagnose-r4 replays remain terminal `blocked` with `liveCalls: 0`.
- **Outcome:** One create-new `--mode diagnose` bundle is unlocked as bounded evidence capture, not task 4.1 proof.
- **Reason:** The next attempt can now observe either a terminal controller result or the exact isolated-server bootstrap logs that r4 omitted.
- **Do-Not-Repeat Condition:** Do not call diagnose r5 a proof, do not increase readiness bounds, and do not start another isolated server if r5 fails without a new causal log observation.
- **Evidence-Based Retry Condition:** Run exactly one `task-4-1-integrated-diagnose-r5`. Replay it offline before any later live attempt. Product proof remains blocked until a captured result/state/PTY bundle can be dispositioned.

## 2026-08-18 - Isolated proof server inherited host HTTP basic auth

- **Objective:** Classify the r5 isolated-startup failure from preserved logs rather than repeating the discarded-log mechanism.
- **Approach:** Replay r5 offline, inspect stdout/stderr tails, and check whether the parent process exports server-auth environment names without reading their values.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r5/raw.json` records listen on loopback, child exit after 15517 ms, probes `/path` and `/session/status` status `401`, XDG config-home loads only, and `isolatedConfigLoaded: false`. Offline `evidence-task-4-1-integrated-diagnose-replay-r5` is terminal `blocked` with `liveCalls: 0`. Parent environment has `OPENCODE_SERVER_PASSWORD` set. Current docs require that variable for HTTP basic auth. `isolatedProofServerEnvironment` previously copied it into the disposable server.
- **Outcome:** Exact missing observation acquired. Isolated-startup lane remains blocked until inherited server auth is stripped.
- **Reason:** The current interactive runtime's server password leaked into the proof-owned server, so the unauthenticated proof client could not pass readiness.
- **Do-Not-Repeat Condition:** Do not inherit `OPENCODE_SERVER_PASSWORD` or `OPENCODE_SERVER_USERNAME` into a disposable proof server, and do not log or persist those values.
- **Evidence-Based Retry Condition:** Delete those names in the shared isolated environment helper, treat isolated XDG config-home logs as the config milestone, replay r5, then run one create-new diagnose.

## 2026-08-18 - Diagnose r6 started the plugin clock on empty XDG config-home

- **Objective:** Re-enter isolated diagnose after stripping inherited server auth.
- **Approach:** Delete host `OPENCODE_SERVER_PASSWORD` from the disposable environment and count isolated XDG config-home logs as the config milestone.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r6/raw.json` records an unsecured loopback listen, `isolatedConfigLoaded: true`, later `OPENCODE_CONFIG_DIR` load of `<fixture>\\config\\opencode.json`, empty command inventory, aborted unauthenticated probes, 73533 ms elapsed, and complete cleanup. Offline replay-r6 is terminal `blocked` with `liveCalls: 0`.
- **Outcome:** Auth isolation is fixed. The plugin-ready window started at the empty XDG config-home load instead of the disposable `OPENCODE_CONFIG_DIR` load, so command inventory never completed.
- **Reason:** Treating XDG config-home as the isolated-config milestone started the 60-second plugin clock before the candidate config loaded.
- **Do-Not-Repeat Condition:** Do not start the plugin-ready clock from empty XDG config-home logs, and do not reuse the r5/r6 durable cache that was populated under those failures.
- **Evidence-Based Retry Condition:** Count only `OPENCODE_CONFIG_DIR` as the isolated-config milestone, delete the durable cache, replay r6, then run one create-new diagnose.

## 2026-08-18 - Diagnose r7 hung after isolated config load with the same inventory timeout

- **Objective:** Give the plugin-ready window to the real `OPENCODE_CONFIG_DIR` load after clearing the poisoned durable cache.
- **Approach:** Revert the XDG config-home milestone, delete the durable cache, and run one more isolated diagnose.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r7/raw.json` matches r6: unsecured listen, isolated `OPENCODE_CONFIG_DIR` load, empty command inventory, aborted `/path` and `/session/status`, 74803 ms, no logs after `opencode.jsonc`, complete cleanup, zero provider calls. Offline replay-r7 is terminal `blocked` with `liveCalls: 0`.
- **Outcome:** Stagnant isolated-startup lane. Two materially similar post-auth attempts produced no command inventory or mission result.
- **Reason:** After disposable config load the isolated server stops answering HTTP inside the existing 60-second plugin window. Clock/cache adjustments did not change that boundary.
- **Do-Not-Repeat Condition:** Do not rerun r6/r7 with the parent `OPENCODE_SESSION_ID` or `OPENCODE_PID` still inherited, and do not increase the plugin window.
- **Evidence-Based Retry Condition:** The current parent exports `OPENCODE_SESSION_ID` and `OPENCODE_PID`. Strip those names in the shared isolated environment, replay r7, then run one create-new diagnose. If that attempt still times out after isolated config load with empty command inventory, stop the isolated `command.list` lane.

## 2026-08-18 - Diagnose r8 confirmed post-config HTTP stall; isolated command.list lane stopped

- **Objective:** Test whether inherited parent session/pid identity caused the post-config inventory stall.
- **Approach:** Delete `OPENCODE_SESSION_ID` and `OPENCODE_PID` from the isolated environment and run one diagnose.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r8/raw.json` still has empty command inventory, aborted `/path` and `/session/status`, isolated config load, unsecured listen, 82156 ms, and no logs after `opencode.jsonc`. Cleanup was `failed`; leftover fixture `roadmap-integrated-proof-wHsErF` had no mission evidence or runtime state and was removed after process readback. Offline replay-r8 is terminal `blocked` with `liveCalls: 0`.
- **Outcome:** Isolated `opencode serve` plus `command.list` readiness is stagnant. Task 4.1 remains incomplete. Live-attempt gate for this lane is blocked.
- **Reason:** Three post-auth attempts (r6-r8) reached the same HTTP-unresponsive boundary after disposable config load. Session/pid isolation did not change the observation.
- **Do-Not-Repeat Condition:** Do not run another isolated integrated `preflight`, `diagnose`, or `capture` through `opencode serve` plus abortable `command.list` readiness. Do not increase timeouts or retry by stripping more environment names alone.
- **Evidence-Based Retry Condition:** First prove, in a provider-free startup-only helper that does not use `command.list` as the sole readiness probe, that the isolated server answers HTTP after `OPENCODE_CONFIG_DIR` load. Only that green startup observation unlocks one later diagnose.

## 2026-08-22 - Startup r1 expired before HTTP because it gated on the config-dir log

- **Objective:** Prove isolated `opencode serve` answers HTTP after `OPENCODE_CONFIG_DIR` load without using `command.list`.
- **Approach:** Add `--mode startup` to the existing integrated runner. Use the isolated per-fixture cache, wait for listen plus the config-dir log, then issue one long abortable `/path` and `/session/status` fetch. Do not inherit the durable cache or call `command.list`.
- **Evidence:** `--help` exits 0. `evidence-task-4-1-integrated-startup-r1/raw.json` records listen on loopback, only empty XDG config-home loads, `isolatedConfigLoaded: false`, empty probes, elapsed 15464 ms, child exit 1, complete cleanup, and zero sessions. `evaluation.json` is `blocked` with `liveCalls: 0`.
- **Outcome:** The helper never reached an HTTP observation. The 15-second config milestone expired after listen and before `OPENCODE_CONFIG_DIR` load.
- **Reason:** HTTP was gated on the config-dir log. Cold isolated cache plus that gate produced no `/path` or `/session/status` fact.
- **Do-Not-Repeat Condition:** Do not rerun startup while waiting for the config-dir log before the first HTTP probe, and do not restore `command.list` readiness.
- **Evidence-Based Retry Condition:** After listen, probe HTTP inside the existing 75-second total envelope without waiting for the config-dir log. Persist listen/probe/startup facts on failure. Replay r1, then run one create-new startup capture.

## 2026-08-22 - Startup r2 leaked the server after a missing readiness constant

- **Objective:** Probe HTTP after listen inside the existing 75-second envelope.
- **Approach:** Stop gating HTTP on the config-dir log and persist partial server facts on failure.
- **Evidence:** `evidence-task-4-1-integrated-startup-r2/raw.json` failed immediately with `PROOF_SERVER_READINESS_MS is not defined`, cleanup `failed`, and leftover fixture `roadmap-integrated-proof-EVGJ5G`. The fixture log had only XDG config-home loads. No proof-owned `opencode` process remained. The fixture was removed after readback (`exists: false`). Offline replay-r1 is terminal `blocked` with `liveCalls: 0`.
- **Outcome:** Runner defect. The HTTP path was not exercised. Task 4.1 remains incomplete.
- **Reason:** The new helper referenced `PROOF_SERVER_READINESS_MS` without importing it, then threw after spawn without stopping the child.
- **Do-Not-Repeat Condition:** Do not spawn an isolated server before the readiness constants resolve, and do not leave a spawned child unswept on helper throw.
- **Evidence-Based Retry Condition:** Import the constant, stop the child in `finally` unless handed off, replay r2, then run one create-new startup capture.

## 2026-08-22 - Startup r3 proved isolated HTTP after config load

- **Objective:** Prove isolated `opencode serve` answers HTTP after `OPENCODE_CONFIG_DIR` load without `command.list`.
- **Approach:** After listen, issue one long abortable `/path` and `/session/status` fetch inside the existing 75-second envelope, using the isolated per-fixture cache and sweeping the child in `finally`.
- **Evidence:** `evidence-task-4-1-integrated-startup-r3/evaluation.json` and `evidence-task-4-1-integrated-startup-r3-replay/evaluation.json` are `complete` with `liveCalls: 0`. Raw records listen, isolated config, no host config, no ripgrep download, `/path` 200, `/session/status` 200, `readyMs: 21140`, empty command inventory, zero sessions, and complete cleanup.
- **Outcome:** Isolated HTTP readiness is green. One later diagnose is unlocked. Task 4.1 remains incomplete.
- **Reason:** Command-list hammering from process start was the stalled probe, not HTTP unavailability after listen and isolated config load.
- **Do-Not-Repeat Condition:** Do not start diagnose/preflight/capture inventory before HTTP 200, and do not restore the durable-cache override or command.list-from-cold-start loop.
- **Evidence-Based Retry Condition:** Reuse HTTP-first readiness, then run exactly one create-new `--mode diagnose` to capture executor result/state/PTY facts. Replay that diagnose before any proof-mode capture.

## 2026-08-22 - Diagnose r9 reached HTTP readiness then blocked on PTY URL before mission-run

- **Objective:** Capture executor result, mission state, and controller PTY buffer through one non-proof diagnose.
- **Approach:** HTTP-first isolated readiness, then the existing `pty-show-server-url` prerequisite before `/mission-run`.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r9/raw.json` records listen, isolated config, `/path` and `/session/status` 200, required commands loaded, `readyMs: 18234`, one operator root deleted, complete cleanup, and failure `PTY Sessions Web Interface URL was not delivered`. Server logs show `pty-show-server-url` handled by the PTY plugin. No mission-run, result, or state. Offline replay-r9 is terminal `blocked` with `liveCalls: 0`.
- **Outcome:** Isolated command.list stall is closed. Product diagnose was not reached. Task 4.1 remains incomplete.
- **Reason:** The runner treated PTY URL discovery as a hard prerequisite. The plugin persisted the URL with `session.prompt({ noReply: true })`, and the immediate message readback did not contain it.
- **Do-Not-Repeat Condition:** Do not block `/mission-run` on `pty-show-server-url`, and do not rerun diagnose through that prerequisite.
- **Evidence-Based Retry Condition:** Launch `/mission-run` first, discover the PTY URL after cockpit visibility or during finalization, persist bounded message text on URL miss, replay r9, then run one create-new diagnose.

## 2026-08-22 - Diagnose r10 captured the missing terminal apply result

- **Objective:** Reach the product diagnose path and preserve the structured executor result.
- **Approach:** Launch `/mission-run` before PTY URL discovery after HTTP-first readiness.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r10/raw.json` records visible running controller, isolated server, three deleted roots, complete cleanup, durable `blocked`, and result `disposition=terminal` `errorMessage=executor opsx-apply returned an assistant error` `writerClosure=terminal` `guardState=unknown`. `terminalStatus` contains `PTY Sessions Web Interface URL: http://[::1]:55522`. Offline replay-r10 is terminal `blocked` with `liveCalls: 0`. Phase file contents were not copied into the raw bundle.
- **Outcome:** The r3 missing result is now known. Structured controller mapping is correct. The one-slice happy path is not green. Task 4.1 remains incomplete.
- **Reason:** Apply returned `info.error`; the executor discarded the original assistant error. PTY URL matching accepted only `127.0.0.1`.
- **Do-Not-Repeat Condition:** Do not infer the apply cause from the generic assistant-error string, and do not require `127.0.0.1` as the only loopback PTY origin.
- **Evidence-Based Retry Condition:** Preserve the bounded original assistant error in the executor result and phase evidence, accept `[::1]` PTY URLs, copy phase facts into the raw bundle, replay r10, then run one create-new diagnose.

## 2026-08-22 - Diagnose r11 identified isolated OpenAI auth miss

- **Objective:** Capture the original assistant error behind the terminal apply result.
- **Approach:** Preserve bounded `info.error` in the executor result and phase evidence, accept `[::1]` PTY URLs, and copy phase facts into the raw bundle.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r11/evaluation.json` is diagnostic `complete` with `proof: false`. Product outcome remains blocked. Result error is `ProviderAuthError` / `OpenAI API key is missing` for `openai`. Host auth.json exists, contains a non-expired `openai` oauth entry, and `OPENAI_API_KEY` is unset. Isolated copy was only written to `XDG_DATA_HOME/opencode/auth.json`. Controller streams and PTY buffer were captured. Cleanup completed.
- **Outcome:** Missing observation acquired. Isolated configured-provider auth is an environment/proof-config defect, not a controller mapping defect. Task 4.1 remains incomplete.
- **Reason:** The disposable server did not use the host OAuth store. A models-fetch-disabled catalog plus a single XDG auth copy is insufficient for ChatGPT OAuth.
- **Do-Not-Repeat Condition:** Do not ask the owner for a new API key, do not put secrets in env/evidence, and do not rerun diagnose with only the XDG auth copy.
- **Evidence-Based Retry Condition:** Copy the existing auth store to both isolated XDG data and `OPENCODE_TEST_HOME/.local/share/opencode`, keep the built-in OpenAI npm identity, record privacy-safe placement sizes, replay r11, then run one create-new diagnose.

## 2026-08-22 - Diagnose r12 still missed OAuth after dual auth copy

- **Objective:** Make the isolated server use the existing non-expired OpenAI OAuth store.
- **Approach:** Copy auth.json to XDG data and TEST_HOME paths and keep `@ai-sdk/openai` on a stub provider catalog.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r12` diagnostic complete, product blocked. `authPlacement` is 3167 bytes in both locations. Apply still returns `ProviderAuthError` / missing API key. Host `~/.cache/opencode/models.json` contains `openai` / `gpt-5.6-sol`. Isolated cache did not receive that catalog.
- **Outcome:** Dual auth copy did not change the error. Task 4.1 remains incomplete.
- **Reason:** Models fetch is disabled and the disposable stub provider replaced the built-in OpenAI provider, so OAuth from auth.json was not applied.
- **Do-Not-Repeat Condition:** Do not declare a stub `provider.openai.models` catalog and do not enable remote models fetch.
- **Evidence-Based Retry Condition:** Seed the isolated XDG cache with the existing host `models.json`, remove the stub provider, keep auth copies, replay r12, then run one create-new diagnose.

## 2026-08-22 - Diagnose r13 lost the session model after dropping the catalog declaration

- **Objective:** Use the built-in OpenAI provider from the seeded models cache so OAuth applies.
- **Approach:** Seed `models.json`, remove the stub `provider.openai.models` declaration, keep auth copies.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-r13` blocked. `authPlacement.modelsBytes` is 4264829. Server logs: `ProviderModelNotFoundError: Model not found: openai/gpt-5.6-sol. Did you mean: gpt-5.6-sol`. Status observed 0 characters. Cleanup complete. No result or mission state.
- **Outcome:** The cache seed loaded model IDs but session command lookup still required the configured `openai/gpt-5.6-sol` declaration. Task 4.1 remains incomplete.
- **Reason:** Models-fetch isolation plus a missing config model entry made slash commands fail before apply.
- **Do-Not-Repeat Condition:** Do not remove the declared model entry while models fetch stays disabled.
- **Evidence-Based Retry Condition:** Keep the seeded `models.json` and auth copies, restore the declared `provider.openai.models` entry without a stub npm override, replay r13, then run one create-new diagnose.

## 2026-08-22 - Isolated OpenAI is connected but apply still lacks an API key

- **Objective:** Distinguish missing isolated auth from apply-time provider invocation.
- **Approach:** Startup r4 listed providers after HTTP readiness. Diagnose r14 kept models.json plus the declared model entry.
- **Evidence:** `evidence-task-4-1-integrated-startup-r4` is complete: `openaiConnected=true`, `openaiModelPresent=true`, auth/models placement sizes recorded, no sessions. `evidence-task-4-1-integrated-diagnose-r14` diagnostic complete; apply still returns `ProviderAuthError` missing API key. Isolated `command.list` and HTTP lanes are green.
- **Outcome:** Isolated configured-provider apply remains blocked. Current loopback runtime with existing OAuth is the unused sufficient product path.
- **Reason:** `provider.list` connected does not make isolated `opsx-apply` receive OAuth as an API key. Further isolated catalog/auth copies repeated the same error.
- **Do-Not-Repeat Condition:** Do not run another isolated diagnose that only reseeds auth/models/catalog declarations.
- **Evidence-Based Retry Condition:** Attach one diagnose to the already running loopback OpenCode using existing server basic auth from the environment, a disposable project directory, and no isolated serve. Never record the password. Clean only proof-created sessions.

## 2026-08-22 - Attach r1 used the wrong HTTP basic username

- **Objective:** Use the current loopback OpenCode, where OpenAI OAuth already works.
- **Approach:** `--runtime-url http://127.0.0.1:4096` with `Authorization` from `OPENCODE_SERVER_PASSWORD` and an empty username.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-attach-r1` blocked. Unauthenticated probes returned 401. Session create failed. Cleanup failed and leftover fixture `roadmap-integrated-proof-QMRWKg` had no mission state; it was removed after readback. A privacy-safe username probe showed empty user=401 and `opencode`=200.
- **Outcome:** Attach auth was wrong. No session or model call occurred.
- **Reason:** OpenCode HTTP basic auth requires username `opencode`.
- **Do-Not-Repeat Condition:** Do not send basic auth with an empty username, and do not stop the attached host server.
- **Evidence-Based Retry Condition:** Default the proof client username to `opencode`, replay attach r1, remove leftover fixtures, then run one create-new attached diagnose.

## 2026-08-22 - Attach r2 opened the controller then leaked disposable MCP children

- **Objective:** Prove one-slice continue through the current loopback OpenCode where OpenAI OAuth already works.
- **Approach:** `--runtime-url http://127.0.0.1:4096` with username `opencode`, disposable project directory, no isolated serve, delete only proof-created sessions.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-attach-r2` shows visible running controller, `runtimeExecutable=node.exe`, cockpit opened, no executor result/state. Cleanup failed. Disposable fixture `roadmap-integrated-proof-xE1DCx` stayed EBUSY because attach started project Serena and codebase-memory MCP children at 14:43. Those proof-owned processes were terminated and the fixture was removed (`exists: false`). Host session list has no remaining `integrated mission operator root`.
- **Outcome:** Current-runtime slash/cockpit launch is green. Attached diagnose is not proof. Task 4.1 remains incomplete.
- **Reason:** The runner treated status text as terminal too early and deleted a still-live disposable project whose MCP children held the fixture.
- **Do-Not-Repeat Condition:** Do not attach another diagnose that starts project MCPs and removes the fixture while the controller or those children may still be live.
- **Evidence-Based Retry Condition:** Wait for durable mission `result.json`/`state.json` or an exited controller with no leftover MCP children; disable or avoid project MCP autostart in the disposable attach project; then run one create-new attached diagnose.

## 2026-08-22 - Attach r3 still started Serena and exited before a mission result

- **Objective:** Capture a durable executor result on the current runtime after disabling disposable MCPs and waiting for result/state files.
- **Approach:** Write project `opencode.json` disabling Serena/codebase-memory, wait for `result.json` or exited-plus-durable-disposition, attach to `127.0.0.1:4096`.
- **Evidence:** `evidence-task-4-1-integrated-diagnose-attach-r3` has visible controller, PTY `exitCode=1`, `durableFiles.result=false`, `durableFiles.state=false`, worktree `?? .serena/`. Cleanup failed. Proof-owned node/python children from 14:45 were terminated and fixture `roadmap-integrated-proof-Qtj7Wl` was removed.
- **Outcome:** Same attach failure class as r2. Attach lane is blocked. Task 4.1 remains incomplete.
- **Reason:** Host config still started Serena in the disposable project. The controller exited 1 before writing mission state/result, so the new wait still finished without product evidence.
- **Do-Not-Repeat Condition:** Do not attach another diagnose that only tweaks wait predicates or project `mcp.enabled` while host config still launches Serena.
- **Evidence-Based Retry Condition:** First prove provider-free why the attached controller exits 1 with no state (controller stdout/preflight). Isolate the attach project from host MCP/config merge. Only then run one attached diagnose.

## 2026-08-24 - Proof fixtures missing harvest gate imports

- **Objective:** Unblock provider-free controller simulate after harvest 3.1 added `automation-dividend.ts`.
- **Approach:** Copy the full `openspec-change` helper set into roadmap proof `installGlobalSource` fixtures. Re-run controller diagnose and provider simulate. Do not attach to 4096 or repeat capture r1.
- **Evidence:** Simulate r1 failed `ERR_MODULE_NOT_FOUND` for `openspec-change/automation-dividend.ts`. Diagnose r1 complete. Simulate r2 complete (`configuredProviderCalls=0`, `simulationCalls=2`, cleanup complete). Capture r1 timed out with empty controllerRuns; leftover only `raw.json`.
- **Outcome:** Provider-free simulate is green. Task 4.1 still incomplete: configured capture and slash/cockpit one-slice proof remain.
- **Reason:** Isolated fixtures copied the gate entrypoint but not its new imports.
- **Do-Not-Repeat Condition:** Do not attach to the host 4096 server or rerun capture r1 unchanged.
- **Evidence-Based Retry Condition:** One create-new configured capture after confirming no leftover capture process, with the updated fixture copy set.

## 2026-08-24 - Hung capture r1 classification and provider-free campaign

- **Objective:** Classify hung capture r1 and advance 4.1 without repeating that 600s capture.
- **Approach:** Provider-free `roadmap-mission-controller --mode campaign`. Do not attach 4096. Do not rerun capture r1.
- **Evidence:** Capture r1: timeout 600s, `providerCalls=[]`, `controllerRuns=[]`, `cleanup=pending`, only `raw.json`. Layer: Proof Runner / Environment, not Product Candidate. Campaign r1 status `complete`. Simulate r2 already complete. Evaluate blocked: runner requires `raw.json` from a capture, not simulate.
- **Outcome:** 4.1 still incomplete. Supported ceiling: provider-free controller campaign and simulate. Configured slash one-slice unproven.
- **Reason:** Timeout/empty calls cannot fail the product. Campaign is a smaller distinct probe.
- **Do-Not-Repeat Condition:** Do not run another 600s configured capture without a finite inner timeout and no leftover processes.
- **Evidence-Based Retry Condition:** One create-new capture with an explicit process timeout below 180s, isolated config, and abort if `controllerRuns` stay empty after 60s.

## 2026-08-24 - Capture r2 aborted empty controller after 60s

- **Objective:** Execute the unlocked create-new configured capture with a wall below 180s and a 60s empty-run abort.
- **Approach:** Strip parent session/pid/config, cap the first controller at 60s, keep isolated `OPENCODE_CONFIG_DIR`, and run one capture r2.
- **Evidence:** `evidence/task-4-1-provider-capture-r2/raw.json` records `emptyControllerAbort=true`, `controllerRuns=[]`, `providerCalls=[{command:local-preflight,status:75}]`, `configuredProviderCalls=0`, cleanup `EPERM` on leftover fixture `roadmap-provider-capture-F6JEwc` which contained `xdg-cache/opencode/bin/rg.exe`. Offline evaluate is `blocked`. No leftover capture process after readback.
- **Outcome:** The 60s abort worked. Task 4.1 remains incomplete. Live-attempt gate for this capture path is blocked.
- **Reason:** The executor wrote the synthetic local-preflight result, but the controller parent did not return before the abort. Isolated provider capture still materialized a ripgrep binary under the fixture cache.
- **Do-Not-Repeat Condition:** Do not rerun configured provider capture with only another timeout/flag change, and do not attach to host `4096`.
- **Evidence-Based Retry Condition:** Seed the isolated ripgrep/cache the same way as SI-2, reuse proof-owned process-tree cleanup on timeout, remove leftover `roadmap-provider-capture-*` fixtures after process readback, replay r2, then run one create-new capture.

## 2026-08-24 - Capture r3 cleaned up but still empty-controller

- **Objective:** Execute the unlocked create-new capture after seeding ripgrep and process-tree fixture cleanup.
- **Approach:** Replay r2 offline (still blocked). Seed host ripgrep into the fixture cache, use `removeProofFixture`, and run one capture r3. The first attempt also wrapped the CLI in `isolatedProofServerEnvironment`; that wrapper is now reverted because r3 produced zero controller output.
- **Evidence:** Offline r2 evaluate remains `blocked`. r3 `raw.json`: `emptyControllerAbort=true`, `controllerRuns=[]`, `providerCalls=[]`, `cleanup=complete`, `failure=spawnSync node ETIMEDOUT`. No leftover `roadmap-provider-capture-*` fixture.
- **Outcome:** Cleanup/EPERM gate closed. Task 4.1 remains incomplete. Live-attempt gate for configured capture is blocked.
- **Reason:** Two empty-controller 60s spawnSync captures produced no controller JSON. r3 lost even the r2 local-preflight observation after the isolated-server environment wrap.
- **Do-Not-Repeat Condition:** Do not run another configured provider capture through 60s spawnSync, and do not wrap this CLI controller in `isolatedProofServerEnvironment`.
- **Evidence-Based Retry Condition:** Provider-free diagnose why `roadmap-mission.ts run` emits no stdout within 15s in the disposable fixture (preflight/controller logs). Only then one create-new capture without the isolated-server env.

## 2026-08-24 - 15s diagnose: spawnSync hides in-flight controller stdout

- **Objective:** Explain empty `controllerRuns` without another configured capture.
- **Approach:** 15s provider-free `--help` plus 15s `simulate`. Inspect executor source: slice-a always writes synthetic `local-preflight` then retries `opencode run` with a 90s child timeout.
- **Evidence:** `evidence/task-4-1-controller-diagnose-15s-r1/evaluation.json`: help exits 0 in-process; simulate 15s is `ETIMEDOUT` with 0 stdout/stderr. r2 wrote `local-preflight` to fixture files while the parent spawnSync still looked empty. Child invoke timeout is 90s; parent abort was 60s.
- **Outcome:** Empty-controller classification is a Proof Runner artifact. Live-attempt gate stays blocked until one capture uses the corrected runner.
- **Reason:** `spawnSync` returns stdout only after exit. A parent timeout shorter than the child `opencode run` always looks empty.
- **Do-Not-Repeat Condition:** Do not treat spawnSync timeout plus empty parent stdout as proof the controller did no work, and do not abort the parent before the 90s child invoke.
- **Evidence-Based Retry Condition:** One create-new capture with parent first-controller timeout ≥ 150s, wall ≥ 400s, timeout recorded as `timed-out` (not empty abort) when `provider-calls.json` exists.

## 2026-08-24 - Capture r4 reached configured apply then parent timeout

- **Objective:** One create-new capture with the corrected runner.
- **Approach:** First-controller 150s, wall 400s, seed ripgrep, `removeProofFixture`, record timeout instead of empty abort.
- **Evidence:** `evidence/task-4-1-provider-capture-r4`: `controllerRuns[0].timedOut=true`, `local-preflight` 75, `opsx-apply` session `ses_fcc9b0fbdffetHEYArqS9nMIjw` status null, session delete 0, cleanup complete. Controller stdout empty because spawnSync returns after kill.
- **Outcome:** Runner classification fixed. Task 4.1 still incomplete. Configured apply did not finish in 150s.
- **Reason:** Slice-a still spends the synthetic preflight attempt plus one live `opencode run` whose 90s child bound plus apply work exceeded the parent 150s.
- **Do-Not-Repeat Condition:** Do not rerun the same 150s first-controller capture, and do not call an empty-controller abort when provider-calls exist.
- **Evidence-Based Retry Condition:** Offline replay of r4 provider-02 logs, then one capture only after the first live apply either has a finite inner result or the executor no longer nests a 90s invoke under a 150s parent.

## 2026-08-24 - r4 replay: fixture permissions and openspec shim

- **Objective:** Give the first live apply a finite path that is not a 90s/150s nest plus host PowerShell policy.
- **Approach:** Replay provider-02: apply started, then `openspec` hit the blocked `.ps1` shim and `openspec.cmd` was denied. Seed a fixture-first `openspec.cmd`/`.ps1`, allow `openspec.cmd` and sibling `global-source` reads, raise invoke to 180s and first-controller to 240s.
- **Evidence:** r4 jsonl lines 14-20. Host `openspec.ps1` is execution-policy blocked; permission allow list had `openspec *` but not `openspec.cmd *`.
- **Outcome:** Selected. One create-new capture r5 is now unlocked.
- **Reason:** The apply did work; the fixture could not finish the OpenSpec CLI or outlive the child timeout.
- **Do-Not-Repeat Condition:** Do not rerun r4's 90s/150s capture or rely on the host PowerShell `openspec` shim.
- **Evidence-Based Retry Condition:** One capture r5 with the shimmed PATH and longer invoke. If r5 still times out after a progressing apply, inspect the new jsonl before another live attempt.

## 2026-08-24 - Capture r5: fixture openspec.ps1 still blocked

- **Objective:** Run the unlocked r5 capture after shim and longer invoke.
- **Approach:** One capture. Do not attach 4096.
- **Evidence:** r5 timed out at 240s. Apply progressed; `openspec status` invoked `<fixture>\\bin\\openspec.ps1` and hit the same ExecutionPolicy block. A PowerShell `;*` diagnostic was denied by fixture bash rules. principles-of-work read succeeded.
- **Outcome:** Task 4.1 incomplete. Live-attempt gate blocked for another identical capture.
- **Reason:** PowerShell prefers `.ps1` over `.cmd`. The fixture shim was itself a `.ps1`.
- **Do-Not-Repeat Condition:** Do not write a fixture `openspec.ps1`, and do not rerun r5 unchanged.
- **Evidence-Based Retry Condition:** One later capture only after the fixture has no `openspec.ps1` and Windows `;*` bash is allowed so apply can finish.

## 2026-08-24 - Capture r6 unlocked by corrected Windows fixture

- **Objective:** Close the exact `r5` fixture and permission blockers before another configured-provider attempt.
- **Approach:** Keep only a fixture-first `openspec.cmd`, remove the fixture `openspec.ps1`, allow `openspec.cmd` and bounded PowerShell command sequences, replay `r5` offline, then rerun provider-free preflight and the complete simulated campaign on the current runner.
- **Evidence:** `r5` evaluator remains terminal `blocked` with cleanup complete and no live call. `evidence/task-4-1-provider-preflight-r6/preflight.json` is `complete` with `modelCalls=0`. `evidence/task-4-1-provider-simulate-r3/evaluation.json` is `complete`: two archives, two checkpoints, three controller processes, one bounded local recoverable failure, protected slice blocked before executor, zero configured-provider calls, and complete cleanup.
- **Outcome:** One create-new configured-provider capture `r6` is unlocked. Task 4.1 remains incomplete until that capture reaches the accepted one-slice boundary and its evidence replays terminally.
- **Reason:** The next attempt uses a causally corrected Windows command-resolution and permission path already proven through the same disposable controller/archive flow.
- **Do-Not-Repeat Condition:** Do not restore `openspec.ps1`, reintroduce a blanket semicolon denial, rerun `r5`, or attach to the host `4096` runtime.
- **Evidence-Based Retry Condition:** Run exactly one `task-4-1-provider-capture-r6`. If it fails, preserve and replay its complete provider/controller bundle before any successor and change the evidenced mechanism rather than only its timeout.

## 2026-08-24 - Capture r6: one slice completed inside the wrong campaign envelope

- **Objective:** Run the unlocked configured-provider capture and prove task 4.1's terminal one-slice mission.
- **Approach:** Run exactly one `task-4-1-provider-capture-r6`, preserve its complete bundle, replay it offline, and inspect the controller/provider sidecars and process inventory without another live call.
- **Evidence:** The first controller used one bounded local retry, completed configured `opsx-apply`, deterministic validation, archive, empty active-change readback, and local checkpoint `2cd8eee2a3e50f0ee3e78a69ba3f08fd0e0f7c9c`. It then correctly paused at cursor 0 because the fixture declared another slice. The second configured `opsx-propose` call preserved a session ref but no terminal status; `controller-resume` preserved empty stdout/stderr and `exit null`. Offline evaluate is terminal `blocked`; cleanup and both session deletions are complete. The later process inventory found no surviving PID 9960.
- **Outcome:** Task 4.1 remains incomplete. The product completed one active change, but the runner exercised a multi-slice campaign and therefore could not prove the required terminal one-slice mission. The later `propose` failure belongs to the unneeded campaign continuation, not the already observed first-slice apply/archive path.
- **Reason:** The capture fixture conflated task 4.1's one-slice terminal boundary with task 4.2's declared-slice campaign. Repeating it or extending timeouts would test the same oversized scenario rather than the accepted 4.1 outcome.
- **Do-Not-Repeat Condition:** Do not rerun `r6`, increase its campaign timeouts, infer terminal mission completion from cursor-0 `paused`, or reuse its partial campaign as task 4.1 proof.
- **Evidence-Based Retry Condition:** Offline-close `r6` as a blocked campaign, then add and provider-free replay an explicit one-slice scenario whose evaluator requires terminal mission completion, exactly one archive/readback/checkpoint, configured session cleanup, and no successor activation. Only that causally narrower scenario may unlock one later configured capture.

## 2026-08-24 - One-slice capture r7 unlocked

- **Objective:** Prove task 4.1 at its exact terminal one-slice configured-provider boundary without entering task 4.2's campaign continuation.
- **Approach:** Extend the existing provider runner with an explicit `one-slice` scenario. Preserve `campaign` as the default, narrow the one-slice allowed effects, require run then checkpoint-resume to terminal `complete`, and make the evaluator reject successor activation or extra archives/executions.
- **Evidence:** `evidence/task-4-1-provider-one-slice-preflight-r1/preflight.json` is `complete` with `modelCalls=0`. `evidence/task-4-1-provider-one-slice-simulate-r1/evaluation.json` is `complete`: one simulated execution, one bounded local retry, one archive/checkpoint, two controller processes, terminal completion, zero successor activations, no protected slice, and complete cleanup. Default campaign regression `evidence/task-4-1-provider-campaign-regression-r4/evaluation.json` remains `complete` with its prior two archives, three controller processes, and protected stop.
- **Outcome:** One create-new configured-provider `task-4-1-provider-one-slice-capture-r7` is unlocked. The live-attempt gate is clear only for this exact scenario.
- **Reason:** Unlike r6, the new scenario cannot invoke `propose`, activate a successor, or consume campaign time after the accepted one-slice outcome. Provider-free execution and offline replay already exercise the same terminal state and evaluator.
- **Do-Not-Repeat Condition:** Do not rerun r6, use the campaign scenario for task 4.1, attach to host `4096`, or extend timeouts. Do not rerun r7 after a failure without preserving and replaying its complete bundle.
- **Evidence-Based Retry Condition:** Run exactly one configured `one-slice` r7 capture. If it fails, close the live gate and use only its preserved evidence until a causally different mechanism is justified.

## 2026-08-24 - Configured one-slice r7 green; integrated startup r5 unlocked

- **Objective:** Join the green configured one-slice controller path to task 4.1's isolated installed slash/cockpit/current-runtime boundary.
- **Approach:** Replay the complete r7 bundle through the package entrypoint, rerun the provider-free controller campaign, and compare the successful provider process configuration with the isolated integrated server's last auth/model failure.
- **Evidence:** `evidence/task-4-1-provider-one-slice-capture-r7/evaluation.json` is `complete`: one configured `opsx-apply`, one bounded local retry, one archive/readback/checkpoint (`35e02838a2738aa1a5058d3faabbe07b6636e73e`), run then fresh resume to terminal `complete`, zero successor activations, state replay valid/writer clear, session deletion complete, fixture cleanup complete, and no remaining capture process. `evidence/task-4-1-controller-regression-r4/evaluation.json` is `complete`. The integrated r14 configuration still disables model discovery and declares a custom provider model; r7 succeeded with the built-in provider and no custom provider declaration.
- **Outcome:** The direct configured controller leg is green but does not alone close task 4.1. One provider-free isolated integrated `startup` r5 is unlocked after matching r7's built-in-provider/model-discovery mechanism. No integrated model call is unlocked yet.
- **Reason:** Removing the custom provider while model discovery remains disabled already failed at r13, and restoring the declaration failed OAuth at r14. Removing the declaration while allowing current model discovery is a causally distinct combination supported by the successful r7 process.
- **Do-Not-Repeat Condition:** Do not attach to host `4096`, repeat r13/r14 auth copies/catalog overrides, rerun provider r7, or start an integrated configured command before startup proves isolated commands plus built-in OpenAI/model visibility with zero model calls.
- **Evidence-Based Retry Condition:** Run exactly one isolated integrated startup r5. Only a green provider/model/command/readiness result may unlock a provider-free integrated preflight and then one configured capture.

## 2026-08-24 - Integrated startup r5 green; provider-free preflight r9 unlocked

- **Objective:** Verify the causally changed isolated runtime at the installed command/launcher/controller boundary before any integrated provider invocation.
- **Approach:** Start a proof-owned OpenCode server with built-in provider resolution and current model discovery, inspect provider identity without creating a session, then remove the server and fixture.
- **Evidence:** `evidence-task-4-1-integrated-startup-r5/evaluation.json` is diagnostic `complete` with `liveCalls=0`: proof-owned HTTP routes answered, isolated config loaded, host config absent, no ripgrep download, no sessions, and cleanup complete. Raw readback reports built-in OpenAI connected with `gpt-5.6-sol` present, both copied OAuth placements present, model discovery enabled, and no remaining proof process.
- **Outcome:** One provider-free integrated preflight r9 is unlocked. No integrated configured call is unlocked until slash command inventory, cockpit/controller visibility, durable stopped state, eligibility, and cleanup are green on the changed runtime.
- **Reason:** Startup directly falsifies the r13 missing-model condition and avoids r14's custom-provider OAuth path without spending a model call.
- **Do-Not-Repeat Condition:** Do not rerun startup r5, attach to host `4096`, or proceed directly to capture.
- **Evidence-Based Retry Condition:** Run exactly one integrated preflight r9. Only terminal-green provider-free evidence may unlock one configured integrated capture.

## 2026-08-24 - Integrated preflight r9: operator session route omitted

- **Objective:** Verify installed slash/cockpit/controller preflight on the changed isolated runtime with zero model calls.
- **Approach:** Start the full proof server, create an operator root through the SDK, invoke `mission-run` after recording stop intent, and require durable paused state plus cleanup.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r9/evaluation.json` is terminal `blocked` with `liveCalls=0` and cleanup complete. Commands loaded and the server remained isolated, but slash dispatch returned `ProviderModelNotFoundError: Model not found: openai/gpt-5.6-sol; Did you mean: gpt-5.6-sol`. Startup r5 had already proven the provider and raw model exist. Source readback shows the integrated runner creates its operator root without the explicit SDK `{providerID, id}` route used by the maintained proof-client helper and completion-guard child creation.
- **Outcome:** Proof Runner defect. No model invocation, mission state, or product mutation occurred; the created root was deleted and no proof process remains. Task 4.1 is unaffected and incomplete.
- **Reason:** The server-side command API tried to derive a default route for a model-less SDK session and treated the full profile route as a raw model id. The provider/catalog configuration was already green.
- **Do-Not-Repeat Condition:** Do not rerun r9, alter provider/auth/model discovery again, attach to host `4096`, or treat the empty status as product evidence.
- **Evidence-Based Retry Condition:** Resolve the loaded `build` agent route through the existing proof-client helper, pass its provider/model/variant explicitly when creating every integrated operator root, then run one provider-free preflight r10.

## 2026-08-24 - Integrated preflight r10: command route omitted

- **Objective:** Re-run provider-free installed slash preflight with an explicitly routed operator session.
- **Approach:** Resolve `build` through the maintained proof-client agent inventory and create the operator root with explicit provider, raw model id, and variant.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r10/evaluation.json` is terminal `blocked` with `liveCalls=0`; cleanup and created-root deletion are complete. Raw readback proves `operatorRoute={agent:build, providerID:openai, modelID:gpt-5.6-sol, variant:xhigh}`. Slash dispatch still reports the same full-id model lookup before mission state or PTY creation. The installed SDK contract for `/session/{sessionID}/command` has separate `agent`, raw `model`, and `variant` body fields; the runner omitted all three.
- **Outcome:** Proof Runner defect narrowed to command invocation. Explicit session routing made the intended identity observable but cannot override the command endpoint's own fallback. No model call or product mutation occurred; no process remains.
- **Reason:** Session route and slash-command route are separate API inputs. The command endpoint continued to derive the bad full-string fallback because the request supplied only command name and arguments.
- **Do-Not-Repeat Condition:** Do not rerun r9/r10, modify provider/auth/model discovery, or only change the session creation payload again.
- **Evidence-Based Retry Condition:** Supply the loaded `build` agent, raw model id `gpt-5.6-sol`, and variant in both integrated slash command requests, preserve the explicit route in raw evidence, then run one provider-free preflight r11.

## 2026-08-24 - Integrated preflight r11: default OAuth plugin disabled

- **Objective:** Verify whether explicit command route fields let provider-free slash dispatch reach the launcher hook.
- **Approach:** Pass the loaded agent, raw model id, and variant in the command body while retaining the isolated provider/catalog configuration.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r11/evaluation.json` is terminal `blocked` with `liveCalls=0`, root deletion complete, fixture cleanup complete, and no remaining process. The same pre-hook model lookup failed. OpenCode v1.18.22 source shows `SessionPrompt.command` always resolves `Provider.getModel` before `command.execute.before`; provider inventory combines catalog and credential presence, but `getModel` uses only loaded providers. OpenAI is `autoload:false` and OAuth is loaded by the built-in Codex auth plugin. The shared isolated environment sets `OPENCODE_DISABLE_DEFAULT_PLUGINS=1`; provider r7 did not and succeeded. The SDK command contract requires `model` in `provider/model` form, not a raw id.
- **Outcome:** Environment/Proof Runner root cause identified. r9-r11 did not reach the launcher or invoke a provider. Task 4.1 remains incomplete.
- **Reason:** Copied OAuth and catalog data made startup inventory look connected but could not load OpenAI while its default auth plugin was disabled. Session/command route changes cannot create the missing provider.
- **Do-Not-Repeat Condition:** Do not rerun r9-r11, attach to host `4096`, copy auth/catalog again, send a raw model id, or trust provider inventory as proof that `Provider.getModel` can resolve.
- **Evidence-Based Retry Condition:** Match provider r7 by enabling built-in default plugins only in the proof-owned integrated server, retain isolated config/data and no custom provider override, send the documented `openai/gpt-5.6-sol` command model, and run one zero-model-call startup r6 before any slash preflight.

## 2026-08-24 - Integrated startup r6 green; preflight r12 unlocked

- **Objective:** Verify the corrected built-in OAuth plugin mechanism without a model call before re-entering slash dispatch.
- **Approach:** Enable default plugins only in the proof-owned integrated server, retain isolated config/data, built-in provider resolution, model discovery, and no custom provider declaration; perform HTTP/provider startup inspection and cleanup without creating a session.
- **Evidence:** `evidence-task-4-1-integrated-startup-r6/evaluation.json` is diagnostic `complete` with `liveCalls=0`: isolated config loaded, host config absent, HTTP routes answered, no session created, no ripgrep download, cleanup complete, and no remaining process. Raw evidence records built-in provider/default plugins/model discovery enabled, OpenAI connected, and `gpt-5.6-sol` present.
- **Outcome:** One provider-free integrated preflight r12 is unlocked. No configured integrated capture is unlocked yet.
- **Reason:** This is the first isolated startup matching provider r7's default auth-plugin mechanism while retaining disposable server/session authority.
- **Do-Not-Repeat Condition:** Do not rerun startup r6 or any r9-r11 route-only preflight; do not attach to host `4096`.
- **Evidence-Based Retry Condition:** Run exactly one provider-free preflight r12 with the documented command route. Only terminal-green slash/cockpit/controller state and cleanup may unlock one configured integrated capture.

## 2026-08-24 - Integrated preflight r12: remote discovery consumed readiness envelope

- **Objective:** Exercise provider-free slash/cockpit/controller preflight with the default OAuth plugin enabled.
- **Approach:** Start the changed isolated server and invoke the installed command only after HTTP and command inventory readiness.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r12/evaluation.json` is terminal `blocked` with `liveCalls=0`; cleanup complete and no process remains. The server listened and loaded isolated config, but `/path` and `/session/status` were aborted at 77.635 seconds before command inventory, session creation, PTY, or mission state. Startup r6 on the same source was green at 68.173 seconds. The fixture already seeds a current 4,294,094-byte models catalog; remote model discovery is not needed to load the OAuth provider and adds an external startup dependency.
- **Outcome:** Environment/Proof Runner readiness failure, not Product Candidate evidence. The default-plugin model lookup correction was not exercised. Task 4.1 remains incomplete.
- **Reason:** Enabling both default plugins and remote model discovery expanded a bounded startup path that was already near the 75-second readiness ceiling. Cached catalog plus default OAuth plugin is the unused narrower mechanism.
- **Do-Not-Repeat Condition:** Do not rerun r12 unchanged, extend readiness timeouts, attach to host `4096`, or remove the declared profile route.
- **Evidence-Based Retry Condition:** Re-disable remote models fetch while keeping the current cached catalog, declared route, no custom provider override, and default plugins enabled. Run one zero-model-call startup r7 before another slash preflight.
