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

## 2026-08-24 - Zero-model idle API diagnostic completed

- **Objective:** Determine whether the installed OpenCode v1.18.22 SDK endpoints used by the completion guard have incompatible response shapes, without another configured provider attempt.
- **Approach:** Add the bounded `idle-api` diagnostic mode to the existing integrated proof runner, start an isolated HTTP server with default plugins disabled, create one model-free root, call `session.status`, `children`, `messages`, `todo`, `diff`, and `get`, then delete the root and server.
- **Evidence:** `evidence-task-4-1-integrated-idle-api-r1/evaluation.json` is diagnostic `complete` with `liveCalls=0` and `proof=false`. All six calls returned their expected object/array shapes, the isolated config loaded with host config absent, exactly one root was deleted, cleanup completed, and no proof process remained.
- **Outcome:** The installed endpoint contracts are sound in isolation. This narrows configured capture r7 to an in-flight guard exception or race, but does not recover or waive its missing `safeError` and does not complete task 4.1.
- **Reason:** Capture r7 lost the original exception behind the fail-closed boundary, while preflight r17 never reached the API probe. The dedicated mode reached the APIs without default-provider startup work or a model call.
- **Do-Not-Repeat Condition:** Do not rerun idle-api r1, use it as provider/in-flight task proof, or infer that every live-session response is valid from an empty-root diagnostic.
- **Evidence-Based Retry Condition:** Re-enter this diagnostic only after an installed SDK/source change or a preserved in-flight response proves that one of the six endpoint shapes differs from the isolated result.

## 2026-08-24 - Local guard retention preflight timed out before guard execution

- **Objective:** Reproduce the completion guard's idle-inspection/certificate path with the maintained local effect-free provider after the six installed SDK endpoints passed in isolation.
- **Approach:** Run `session-completion-guard-restart.ts` once in `retention-preflight` capture mode against a create-new evidence root.
- **Evidence:** `evidence-task-4-1-guard-retention-preflight-r1/failure.json` records `stage=setup`, configured-plugin initialization readiness timeout, aborted `/path` and `/session/status` probes, zero primary/arbiter provider calls, complete cleanup, and no remaining proof process.
- **Outcome:** Environment/Proof Runner readiness failure before production guard execution. It provides no new Product Candidate evidence and does not unlock a repeat.
- **Reason:** The isolated OpenCode server listened but did not answer the session-readiness probes inside the runner's existing supervised envelope.
- **Do-Not-Repeat Condition:** Do not rerun retention-preflight r1 unchanged, extend its 120-second worker/server limit, or attribute its setup failure to idle inspection or certificate code.
- **Evidence-Based Retry Condition:** Retry only after a causally distinct provider-free route proves configured-plugin readiness inside the existing envelope or after the exact readiness defect is corrected and replayed offline.

## 2026-08-24 - Completed-root inspection and certificate evidence replayed provider-free

- **Objective:** Separate deterministic completed-message/certificate-reader incompatibility from a transient live-state failure in configured capture r7.
- **Approach:** Extend the existing guard test owner with one in-memory/SQLite case containing 11 completed assistant messages, including the observed array-shaped tool error. Run `inspectRootEvidence` and `captureArbiterEvidence` for the same root and require exact session correlation with no omissions.
- **Evidence:** `node tools/test-session-completion-guard.ts` is green at 42/42. The new case retains all 11 assistant evidence references and resolves the message-bearing session graph to the expected root. A Bun-only exploratory variant also reached the controller's bounded terminal-certificate wait before its disposable SQLite directory hit a Windows `EBUSY` cleanup lock; that unretained variant is not lifecycle evidence.
- **Outcome:** Deterministic inspection, runtime-context parsing, SQLite evidence capture, and root qualification are not the r7 cause. The supported remaining class is a transient in-flight status/child/get/database-visibility failure or another live-only race before audit.
- **Reason:** The r7 bundle lacks the original `safeError`, but its exact completed-message shape can be replayed through both pure consumers without a provider or server.
- **Do-Not-Repeat Condition:** Do not rerun the completed-root replay unchanged, convert the isolated result into task proof, or add production behavior to mask an unclassified live race.
- **Evidence-Based Retry Condition:** Re-enter only if a preserved live response or source change invalidates the replay shape. The next live diagnostic must preserve the owning error and use a causally distinct local-provider readiness mechanism.

## 2026-08-24 - Retention r2 unlocked through existing HTTP-first readiness

- **Objective:** Reach the maintained local effect-free provider guard boundary without repeating retention-preflight r1's setup timeout or increasing its envelope.
- **Approach:** Change only the first retention server startup from repeated five-second SDK status probes with a 60-second post-config deadline to the runner's existing HTTP-first `/path` then `/session/status` mechanism under the unchanged 75-second total readiness constant.
- **Evidence:** `evidence-task-4-1-integrated-idle-api-r1/raw.json` reached both routes with default plugins disabled at 68.952 seconds. Retention-preflight r1 listened and loaded isolated config but repeated abortable SDK status requests until its earlier configured-plugin deadline; it made zero provider calls and cleaned up.
- **Outcome:** One create-new local-provider `retention-preflight` r2 is unlocked. This is a Proof Runner readiness correction only; it does not alter completion-guard or mission behavior.
- **Reason:** The prior mechanism's post-config deadline expired before the independently measured local readiness time, while the unused HTTP-first helper already owns the shared bounded envelope and avoids repeated aborted instance initialization.
- **Do-Not-Repeat Condition:** Do not rerun retention-preflight r1, increase timeout constants, enable default plugins, or continue to a configured OpenAI attempt from startup alone.
- **Evidence-Based Retry Condition:** Run exactly one retention-preflight r2. Only green seed status, local-provider calls, isolated startup, and cleanup may unlock a later local-provider live guard case.

## 2026-08-24 - Retention preflight r2 exposed non-terminal primary framing

- **Objective:** Reach a realistic idle local-provider child after switching to bounded HTTP-first readiness.
- **Approach:** Run one create-new `retention-preflight` r2 with the existing local effect-free provider and unchanged timeouts.
- **Evidence:** `evidence-task-4-1-guard-retention-preflight-r2/failure.json` records server ready, then the first interrupted-child prompt timed out after 15 seconds with `primaryCalls=166`, `arbiterCalls=0`, loop steps 160-166 in the preserved log tail, complete cleanup, and no remaining process. Source comparison with the green roadmap runtime simulator shows the retention simulator's primary branch always returns JSON while its arbiter branch and the green simulator honor `body.stream` with terminal SSE frames.
- **Outcome:** Proof Runner simulator defect. HTTP-first readiness is accepted; no completion-guard idle or certificate behavior was observed.
- **Reason:** OpenCode requested streaming primary completion, but the local simulator omitted SSE `finish_reason=stop` and `[DONE]`, so OpenCode started another primary step repeatedly.
- **Do-Not-Repeat Condition:** Do not rerun r2, increase the 15-second prompt bound, classify the call loop as a Product Candidate defect, or proceed to configured OpenAI capture.
- **Evidence-Based Retry Condition:** Make the primary branch mirror the existing arbiter/roadmap streaming response, add an offline primary-stream terminal-frame preflight, then run exactly one create-new retention-preflight r3.

## 2026-08-24 - Retention preflight r3 unlocked after primary stream correction

- **Objective:** Re-enter the local-provider seed-idle boundary only after the r2 simulator loop is impossible.
- **Approach:** Honor `body.stream` in the retention simulator's primary branch and require the existing offline unlock preflight to observe `text/event-stream`, `finish_reason=stop`, and `[DONE]` on a primary request.
- **Evidence:** The corrected branch is identical in mechanism to the already-green roadmap runtime simulator and to the retention arbiter branch. The offline preflight executes before any OpenCode server or evidence-root mutation.
- **Outcome:** One create-new `retention-preflight` r3 is unlocked. It remains provider-free/local and cannot establish task 4.1 by itself.
- **Reason:** The correction addresses the exact r2 framing mismatch without changing guard, mission, OpenCode, provider-call, or timeout semantics.
- **Do-Not-Repeat Condition:** Do not bypass the offline stream preflight, rerun r2, or continue after another non-terminal primary loop.
- **Evidence-Based Retry Condition:** Run exactly one r3. Only one-call-per-seed terminal idle status with complete cleanup may unlock a later local-provider live guard/certificate diagnostic.

## 2026-08-24 - Retention preflight r3 completed

- **Objective:** Prove the corrected local provider reaches canonical idle exactly once per seed before exercising live guard recovery.
- **Approach:** Run one create-new `retention-preflight` r3 after the offline primary SSE terminal-frame check and HTTP-first readiness correction.
- **Evidence:** `evidence-task-4-1-guard-retention-preflight-r3/evaluation.json` is `complete`. Raw evidence records OpenCode 1.18.22, isolated config loaded, host config absent, readiness in 13.539 seconds, exactly two primary calls for two interrupted seeds, both statuses `absent-idle`, zero arbiter calls, complete cleanup, and no remaining process.
- **Outcome:** Local provider framing and seed-idle semantics are accepted. One existing `retention-recovery` live local guard scenario is unlocked; task 4.1 remains incomplete.
- **Reason:** The r2 call loop is absent, and the retained children are now in the exact idle state consumed by completion-guard restart reconciliation.
- **Do-Not-Repeat Condition:** Do not rerun retention-preflight r3 or treat seed idle as guard/certificate proof.
- **Evidence-Based Retry Condition:** Run exactly one create-new retention-recovery capture. Only a passed recovered guard with bounded arbiter calls, finite retained children, unrelated-child preservation, complete cleanup, and no retention-limit error may unlock a better-observed integrated configured attempt.

## 2026-08-24 - Retention recovery r1 did not re-enter the guard

- **Objective:** Exercise live local-provider idle inspection, evidence capture, restart recovery, and arbitration after seed-idle preflight completed.
- **Approach:** Run one create-new `retention-recovery` r1 under the accepted HTTP-first readiness mechanism.
- **Evidence:** `evidence-task-4-1-guard-retention-recovery-r1/failure.json` records HTTP-first `/path` timeout before root/session creation, zero primary and arbiter calls, complete cleanup, and no remaining process.
- **Outcome:** Environment/Proof Runner readiness failure with no Product Candidate observation. The local recovery lane is blocked and will not be repeated.
- **Reason:** Isolated server initialization remained nondeterministic despite r3's 13.539-second startup; this attempt exhausted the shared 75-second route envelope before the guard existed.
- **Do-Not-Repeat Condition:** Do not rerun retention-recovery r1, extend readiness constants, or treat zero provider calls as guard evidence.
- **Evidence-Based Retry Condition:** Re-enter the local recovery lane only after a source/environment change causally fixes HTTP readiness. Otherwise use the green deterministic replay plus r3 seed-idle evidence and improve observation at the original integrated boundary.

## 2026-08-24 - Better-observed integrated capture r8 unlocked

- **Objective:** Re-enter task 4.1's exact configured slash/cockpit/current-runtime boundary once without losing the owning completion-guard error again.
- **Approach:** Retain the runner's full-stream critical-line extraction independently of mission-status noise; keep the accepted in-project config, OpenAI-only provider scope, exact `openai/gpt-5.6-sol`/`xhigh` route, operation-gate seed, certificate issuer, unchanged timeouts, and complete failure-path provider/guard/project collection.
- **Evidence:** `node tools/test-session-completion-guard.ts` is green 42/42 for the completed 11-message inspection/evidence path. `evidence-task-4-1-integrated-idle-api-r1` is diagnostic complete for all six installed SDK endpoints with zero live calls. `evidence-task-4-1-guard-retention-preflight-r3` is complete with exactly two local primary calls reaching canonical idle. `evidence-task-4-1-integrated-finalizer-selftest-r7` is complete with zero live calls and all issuer/gate/buffer/result/state/cleanup checks green. Local retention-recovery r1 remained blocked before any provider call and is not reused.
- **Outcome:** Exactly one create-new configured integrated capture r8 is unlocked as both candidate proof and bounded missing-error observation. No unchanged successor attempt is authorized.
- **Reason:** Deterministic inspection/evidence incompatibility is falsified, the local seed reaches terminal idle, and the original r7 observation defect is corrected. A transient live-state race remains possible and can only be classified at the exact configured boundary.
- **Do-Not-Repeat Condition:** Do not rerun r4-r8, alter provider/model/profile/timeouts, attach to host `4096`, or discard a failing r8 in favor of another live attempt.
- **Evidence-Based Retry Condition:** Run r8 once. On any result, close all processes, preserve and offline-replay the bundle. A green exact outcome may complete task 4.1; a failure remains blocked until its now-preserved critical diagnostic names a causally correctable defect.

## 2026-08-24 - Integrated capture r8 blocked before product execution

- **Objective:** Re-enter the exact configured slash/cockpit/current-runtime one-slice boundary with non-evicting critical diagnostics.
- **Approach:** Run one create-new configured capture r8 with the accepted OpenAI-only/default-Codex mechanism, exact `openai/gpt-5.6-sol`/`xhigh` route, unchanged 75-second readiness envelope, and current failure-path observer; then replay the bundle offline.
- **Evidence:** `evidence-task-4-1-integrated-capture-r8/evaluation.json` and `evidence-task-4-1-integrated-capture-replay-r8/evaluation.json` are terminal `blocked` with `liveCalls=0`. Raw evidence records isolated config loaded, host config absent, listener started, then `/path` timed out at 77.367 seconds before command inventory, session, cockpit, controller, executor, repository mutation, or provider execution. Cleanup is complete and no correlated process remains.
- **Outcome:** Environment/Proof Runner startup failure with no Product Candidate observation. Task 4.1 remains open; the configured live gate is blocked and r8 is terminal.
- **Reason:** OpenCode v1.18.22 official tagged source (`packages/opencode/src/plugin/index.ts`) loads all internal plugins sequentially behind one `disableDefaultPlugins` flag. Exact OpenAI OAuth requires internal `CodexAuthPlugin`; disabling defaults removes that provider loader, while enabling defaults admits the all-internal-plugin startup path whose readiness remains nondeterministic. The current version exposes no supported selective Codex-only switch.
- **Do-Not-Repeat Condition:** Do not rerun r4-r8, repeat full-default-plugin isolated serve inside the current envelope, extend timeouts, disable defaults, substitute provider/model, vendor authentication behavior, attach to host `4096`, or mark task 4.1 from compositional evidence.
- **Evidence-Based Retry Condition:** Re-enter only after a supported OpenCode environment/source change provides deterministic readiness with Codex OAuth inside the existing envelope or a supported selective internal-plugin mechanism. Re-establish zero-call startup/preflight first, then use a new Candidate/Environment identity and replay all invalidated gates before one configured attempt.

## 2026-08-24 - Owner retained OpenCode 1.18.22 and widened proof readiness

- **Objective:** Resolve the exact environment blocker without changing OpenCode version, provider, model, authentication mechanism, or product runtime semantics.
- **Approach:** The owner explicitly requires OpenCode 1.18.22 and authorizes a 120-second or, if evidence requires it, larger finite proof-server readiness envelope. Apply the smallest first increment: retain the 15-second isolated-config stage and increase configured/internal plugin readiness from 60 to 105 seconds for a 120-second total.
- **Evidence:** Integrated capture r8 reached listener/config load but `/path` was aborted at 77.367 seconds under the former 75-second total, with zero provider calls and complete cleanup. OpenCode v1.18.22 tagged source confirms Codex OAuth is available only through the all-internal-plugin startup path.
- **Outcome:** The former timeout prohibition is superseded by an explicit owner compatibility/performance decision. One zero-call startup r10 is unlocked under the 120-second envelope; no configured model call is unlocked yet.
- **Reason:** The observed environment was still initializing after the old proof deadline, while the accepted outcome requires retaining v1.18.22. Enlarging only proof readiness is narrower than changing auth, provider, model, OpenCode source, or product command behavior.
- **Do-Not-Repeat Condition:** Do not alter product/model/command timeouts, substitute OpenCode/provider/model/auth, attach to host `4096`, or jump directly to configured capture.
- **Evidence-Based Retry Condition:** Run startup r10 once. Only isolated config, HTTP routes, exact OpenAI model inventory, zero sessions/model calls, bounded readiness, cleanup, and no remaining process may unlock provider-free slash preflight r18.

## 2026-08-24 - Integrated startup r10 completed under 120-second envelope

- **Objective:** Re-establish zero-call OpenCode 1.18.22 readiness with exact Codex OAuth before slash execution.
- **Approach:** Run one isolated startup r10 with 15-second config plus 105-second plugin readiness and the accepted OpenAI-only cached-catalog mechanism.
- **Evidence:** `evidence-task-4-1-integrated-startup-r10/evaluation.json` is diagnostic `complete` with `liveCalls=0`. Raw evidence records readiness at 87.003 seconds, `/path` and `/session/status` 200, only `openai` connected, `gpt-5.6-sol` present, isolated config loaded, host config and ripgrep download absent, zero sessions, complete cleanup, and no remaining process.
- **Outcome:** The owner-approved envelope resolves the environment blocker at startup. Exactly one provider-free slash/cockpit preflight r18 is unlocked; configured capture remains locked.
- **Reason:** The same v1.18.22/default-Codex path that exceeded 75 seconds completed unchanged inside 120 seconds.
- **Do-Not-Repeat Condition:** Do not rerun startup r10, reduce the accepted envelope, substitute provider/model/auth, or start configured capture before slash preflight.
- **Evidence-Based Retry Condition:** Run preflight r18 once. Only exact route, installed slash dispatch, visible controller/cockpit, paused terminal state, idle API facts, zero model-root creation, OpenSpec preflight, cleanup, and no remaining process may unlock configured capture r9.

## 2026-08-24 - Preflight r18 exceeded the first owner-approved envelope

- **Objective:** Exercise the installed slash/cockpit boundary after startup r10 proved OpenCode 1.18.22 ready inside 120 seconds.
- **Approach:** Run one provider-free preflight r18 with the same isolated OpenAI/default-Codex environment and no configured model call.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r18/evaluation.json` is terminal `blocked` with `liveCalls=0`. Raw evidence records listener and isolated config load, then `/path` timeout at 122.638 seconds, before command inventory, root, idle API, slash command, cockpit, controller, mission, repository mutation, or provider call. Cleanup is complete and no process remains.
- **Outcome:** Environment/Proof Runner startup failure only. The owner-authorized larger finite envelope is now required; no Product Candidate path was exercised.
- **Reason:** Startup r10 completed at 87.003 seconds, but a fresh v1.18.22 internal-plugin initialization remained active beyond the initial 120-second bound. The observed 122.638-second lower bound justifies the next finite 180-second total without changing product timeouts.
- **Do-Not-Repeat Condition:** Do not rerun r18, jump to configured capture, change provider/model/auth/version, or increase product/model/command timeouts.
- **Evidence-Based Retry Condition:** Use 15-second config plus 165-second plugin readiness, then run exactly one zero-call startup r11. Only a green startup may unlock preflight r19.

## 2026-08-24 - Integrated startup r11 completed under 180-second envelope

- **Objective:** Re-establish zero-call readiness after r18 measured startup beyond 120 seconds.
- **Approach:** Run one isolated startup r11 with the same OpenCode 1.18.22, default Codex OAuth, OpenAI-only provider scope, cached catalog, and 180-second total proof readiness.
- **Evidence:** `evidence-task-4-1-integrated-startup-r11/evaluation.json` is diagnostic `complete` with `liveCalls=0`. Raw evidence records readiness at 106.132 seconds, both HTTP routes 200, only OpenAI connected, `gpt-5.6-sol` present, no sessions, isolated config, no host config/download, complete cleanup, and no remaining process.
- **Outcome:** The 180-second environment is accepted for the next gate. Exactly one provider-free preflight r19 is unlocked.
- **Reason:** The path completed with 73.868 seconds of bounded headroom and no product/provider effect.
- **Do-Not-Repeat Condition:** Do not rerun startup r11 or start configured capture before preflight.
- **Evidence-Based Retry Condition:** Run preflight r19 once. Only full provider-free slash/cockpit/controller eligibility and cleanup may unlock configured capture r9.

## 2026-08-24 - Integrated preflight r19 completed

- **Objective:** Prove the installed slash/cockpit/controller boundary under the accepted OpenCode 1.18.22 readiness environment before any configured call.
- **Approach:** Run one provider-free preflight r19 with exact `openai/gpt-5.6-sol`/`xhigh` routing and the 180-second proof readiness bound.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r19/evaluation.json` is `complete` with `liveCalls=0`. All commands loaded; six idle APIs returned expected shapes; `/mission-run` opened the shared cockpit and named controller PTY; the mission stopped provider-free at durable `paused`; deterministic preflight returned `eligible`; no model root was created; one operator root was deleted; cleanup completed; no process remains. Server readiness was 87.186 seconds with isolated config and no host config/download.
- **Outcome:** Startup, route resolution, installed slash dispatch, cockpit visibility, controller lifecycle, mission eligibility, and cleanup are green on one environment identity. Exactly one configured integrated capture r9 is unlocked.
- **Reason:** This closes every provider-free prerequisite named by task 4.1 under the owner-approved v1.18.22 bound.
- **Do-Not-Repeat Condition:** Do not rerun preflight r19, alter route/provider/model/auth/timeouts, attach to host `4096`, or schedule an unchanged successor after r9.
- **Evidence-Based Retry Condition:** Run configured capture r9 once, then close all processes and replay its preserved bundle offline. Only terminal complete across apply/archive/readback/local commit/cockpit/session cleanup may close task 4.1.

## 2026-08-24 - Configured capture r9 reproduced guard error under status polling

- **Objective:** Complete the exact one-slice installed mission after the v1.18.22 readiness blocker was resolved.
- **Approach:** Run one configured capture r9 with exact OpenAI route and the green r19 environment, then replay its preserved bundle offline.
- **Evidence:** Capture and replay evaluations are terminal `blocked`; capture records 14 completed `openai/gpt-5.6-sol` assistant responses, visible controller, isolated server, two deleted roots, complete cleanup, and no remaining process. The model completed the single task, apply verification returned `all_done`, validation passed, and runtime ownership was clear. The completion guard again entered `error` before certificate/audit, leaving archive/checkpoint unexecuted. The controller performed continuous `/mission-status` polling throughout the model run; OpenCode 1.18.22 logs every expected launcher interception as an error, and those records again consumed the critical diagnostic budget before finalization. Offline replay made zero calls and matched `blocked`.
- **Outcome:** Product outcome remains blocked, but the next missing-observation mechanism is exact: proof polling both loads the shared runtime during idle settlement and evicts the owning error. All writers/sessions/processes are terminal.
- **Reason:** r9 reproduces r7 only while the proof runner emits repeated slash commands against the same server; deterministic completed-root guard consumers and isolated idle APIs remain green. The observer must stop perturbing the live idle boundary before a production defect can be classified.
- **Do-Not-Repeat Condition:** Do not rerun r9, retain continuous terminal status polling, enlarge model/command timeouts, or modify production guard semantics from the generic wrapper.
- **Evidence-Based Retry Condition:** After the first `running` observation, wait on canonical durable mission state and cockpit PTY terminal state, then issue one final slash status readback. Exclude expected launcher/PTY interception sentinels from critical-log capacity. Prove this observer in selftest r8 and provider-free preflight r20 before one configured r10.

## 2026-08-24 - Non-perturbing terminal observer selftest completed

- **Objective:** Prove the new terminal observation path before loading an installed server or provider.
- **Approach:** Extend integrated selftest to read a terminal durable `state.json`, wait for the named PTY to report `exited`, and preserve finalizer facts without repeated slash polling.
- **Evidence:** `evidence-task-4-1-integrated-finalizer-selftest-r8/evaluation.json` is `complete` with `liveCalls=0`; `observerTerminal` and all prior certificate issuer, gate, controller buffer, marker, result, state, and cleanup checks are true.
- **Outcome:** Exactly one provider-free preflight r20 is unlocked. Configured capture remains locked.
- **Reason:** The proof-owned owners of terminal state and cockpit liveness now provide the same observation needed by capture without perturbing the OpenCode command/session path.
- **Do-Not-Repeat Condition:** Do not rerun selftest r8 or bypass the installed provider-free observer proof.
- **Evidence-Based Retry Condition:** Run preflight r20 once. Only terminal durable state, terminal PTY, one final status readback, exact route, zero model call, and complete cleanup may unlock configured r10.

## 2026-08-24 - Non-perturbing installed preflight r20 completed

- **Objective:** Prove the corrected observer against the installed OpenCode 1.18.22 slash/cockpit path before another configured call.
- **Approach:** Run provider-free preflight r20 using durable state, cockpit PTY terminal wait, and one final slash status readback.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r20/evaluation.json` is `complete` with `liveCalls=0`. Durable state reached `paused`, the named PTY reached `exited`, the single final status transcript is 1,480 characters, exact route and six idle APIs are green, no model root was created, one root was deleted, server readiness was 134.633 seconds, cleanup completed, and no process remains.
- **Outcome:** The observer correction is accepted at the installed boundary. Exactly one configured capture r10 is unlocked.
- **Reason:** r20 exercises the same launcher/state/PTY/status composition as capture without continuous OpenCode command traffic.
- **Do-Not-Repeat Condition:** Do not rerun r20, restore terminal slash polling, or schedule an unchanged successor after r10.
- **Evidence-Based Retry Condition:** Run configured r10 once and replay offline. A green complete outcome closes task 4.1; any guard failure must retain its exact non-benign critical diagnostic and blocks further live work until corrected.

## 2026-08-24 - Configured r10 identified direct database authority mismatch

- **Objective:** Complete task 4.1 or preserve the exact owning guard error after removing terminal status polling.
- **Approach:** Run configured capture r10 once with the non-perturbing observer, then replay offline.
- **Evidence:** Capture/replay are terminal `blocked`; capture records 16 completed exact-route responses, completed marker/task/validation, visible controller, isolated server, terminal writer, two deleted roots, complete cleanup, and no remaining process. Critical diagnostics now preserve the exact repeated cause: `Completion evidence does not match the inspected root session` from `captureArbiterEvidence` before certificate/audit. The OpenCode process inherited host `OPENCODE_DB`, while `session-delivery-context` discovered only `OPENCODE_DATA_DIR`, XDG, and home data directories. Offline replay made zero calls.
- **Outcome:** Root cause identified as shared database authority mismatch, not model behavior, completion semantics, timeout, or status-polling load. Product/fixture correction is authorized; configured live gate remains blocked until provider-free proof.
- **Reason:** OpenCode 1.18.22 and the completion evidence reader selected different database paths for the same root, so exact correlation correctly failed closed.
- **Do-Not-Repeat Condition:** Do not rerun r10, weaken the root-ref check, copy host database state, attach to host `4096`, or hide the mismatch by stripping the environment only in capture.
- **Evidence-Based Retry Condition:** Honor direct `OPENCODE_DB` in the canonical reader, set proof `OPENCODE_DB` to its disposable XDG database, prove env-based completed-root correlation in focused tests, then run provider-free selftest/preflight before any configured successor.

## 2026-08-24 - Direct database authority correction passed focused tests

- **Objective:** Ensure OpenCode and completion evidence resolve the same exact session database without weakening correlation or reading host proof state.
- **Approach:** Add direct `OPENCODE_DB` discovery to the canonical delivery-context reader, point isolated proof `OPENCODE_DB` at `<runtime>/data/opencode/opencode.db`, and change the completed-root regression to resolve exclusively through the environment path. Record the exact temporary ownership transfer from `bound-completion-runtime-hot-paths`.
- **Evidence:** `node tools/test-session-completion-guard.ts` passes 42/42; `npm run test:focused:session-plugin` passes 18/18; strict validation passes for both active changes; path-scoped diff checks pass. The completed 11-message root now resolves from `OPENCODE_DB` with the exact expected ref and no missing session.
- **Outcome:** Source-level database authority mismatch is corrected. Integrated selftest r9 and installed provider-free preflight r21 are unlocked; configured calls remain locked.
- **Reason:** Both OpenCode 1.18.22 and the delivery reader now share one explicit database authority, while proof authority is technically contained inside its disposable runtime.
- **Do-Not-Repeat Condition:** Do not pass explicit test-only db paths, read/copy the host database into proof, remove exact root correlation, or broaden the transferred hot-path ownership.
- **Evidence-Based Retry Condition:** Run selftest r9, then preflight r21. Only green observer/finalizer and installed isolated DB/session cleanup evidence may unlock one configured r11.

## 2026-08-24 - Database-corrected integrated selftest r9 completed

- **Objective:** Revalidate the integrated finalizer/observer after changing shared database authority.
- **Approach:** Run selftest r9 without an OpenCode server or provider.
- **Evidence:** `evidence-task-4-1-integrated-finalizer-selftest-r9/evaluation.json` is `complete` with `liveCalls=0`; issuer, operation gate, durable/PTY observer, controller buffer, result, state, marker, and cleanup checks are all true.
- **Outcome:** Installed provider-free preflight r21 is unlocked.
- **Reason:** The integrated proof's non-live owners remain coherent after the database correction.
- **Do-Not-Repeat Condition:** Do not rerun selftest r9.
- **Evidence-Based Retry Condition:** Run preflight r21 once; require isolated database/session cleanup and all prior slash/cockpit gates before configured r11.

## 2026-08-24 - Database-corrected installed preflight r21 completed

- **Objective:** Re-prove the installed provider-free boundary with proof-owned direct database authority.
- **Approach:** Run preflight r21 under OpenCode 1.18.22 with `OPENCODE_DB` pointing inside the disposable runtime and the non-perturbing observer.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r21/evaluation.json` is `complete` with `liveCalls=0`; commands, exact route, six idle APIs, mission eligibility, slash/cockpit boundary, PTY finalization, isolation, root cleanup, and fixture cleanup are green. No process remains.
- **Outcome:** Exactly one configured capture r11 is unlocked against the corrected source/environment identity.
- **Reason:** Every provider-free prerequisite and the exact r10 database authority correction now pass through the installed entrypoint.
- **Do-Not-Repeat Condition:** Do not rerun r21, alter provider/model/auth/timeouts, or run an unchanged successor after r11.
- **Evidence-Based Retry Condition:** Run configured r11 once and replay offline. Only complete apply/archive/readback/local commit and terminal guard/certificate evidence close task 4.1.

## 2026-08-25 - Configured r11 exposed terminal pass regression

- **Objective:** Complete task 4.1 against the database-corrected, non-perturbing installed path.
- **Approach:** Run one configured capture r11 after selftest r9 and preflight r21, preserve the complete bundle, and stop all correlated processes before diagnosis.
- **Evidence:** `evidence-task-4-1-integrated-capture-r11/evaluation.json` is terminal `blocked` with 11 completed exact-route responses, provider execution, visible controller, isolated server, session cleanup, and complete process cleanup. The model completed the one-slice apply work and validation. The guard accepted the terminal certificate and persisted `Completion guard passed (certified)`, but a later duplicate idle event rewrote the in-memory and persisted state to `settling-idle`; the executor then correctly refused archive/checkpoint because terminal-clear was absent.
- **Outcome:** Task 4.1 remains open. The prior database mismatch is closed, and the new accepted-outcome defect is localized to terminal completion-guard state stability.
- **Reason:** `scheduleIdle` accepts an already-passed root, immediately assigns `settling-idle`, and schedules another idle inspection. New human input already uses `cancelAudit` to return a passed root to `running`, so ignoring duplicate idle events only while the root remains terminal `passed` preserves legitimate later turns.
- **Do-Not-Repeat Condition:** Do not rerun r11, restore slash status polling, change model/command timeouts, or treat the certified message without terminal state as task completion.
- **Evidence-Based Retry Condition:** Replay r11 offline to a terminal verdict, then add the smallest terminal-idle guard and provider-free regression. Revalidate the installed provider-free path before any causally distinct configured successor.

## 2026-08-25 - Configured r11 offline replay completed

- **Objective:** Close every reachable non-side-effecting finalization stage before changing production guard behavior or considering another configured invocation.
- **Approach:** Replay the preserved r11 raw bundle with the integrated runner and no OpenCode server or provider.
- **Evidence:** `evidence-task-4-1-integrated-capture-replay-r11/evaluation.json` is terminal `blocked`, matches all capture checks, and the replay invocation made `liveCalls=0`. Capture and replay both report `controllerTerminal=false` and `executorTerminalClear=false`; all cleanup/isolation checks remain true.
- **Outcome:** The r11 replay obligation is complete. The governed configured lane remains blocked while the terminal-state regression is uncorrected.
- **Reason:** Offline replay confirms that evaluator/finalizer behavior is deterministic and cannot manufacture terminal-clear from the preserved `settling-idle` state.
- **Do-Not-Repeat Condition:** Do not rerun capture or replay r11, alter evaluator criteria, or waive terminal guard state.
- **Evidence-Based Retry Condition:** Correct duplicate-idle scheduling for terminal passed roots, prove it provider-free at the owning controller boundary, then replay affected installed preflight gates. Only a green causally distinct candidate may unlock one configured successor.

## 2026-08-25 - Terminal passed state correction completed provider-free

- **Objective:** Keep an accepted terminal certificate observable as terminal-clear while preserving later genuine human turns.
- **Approach:** Make `scheduleIdle` ignore duplicate idle events while the root remains `passed`; retain the existing human-message `cancelAudit` transition back to `running`. Add the exact oracle to the existing Bun controller proof and update that proof's stale verdict fixtures with the required empty `claimMatrix`.
- **Evidence:** `node tools/test-session-completion-guard.ts` passes 42/42. `bun tools/proofs/session-completion-guard-question.ts` is green with `terminalIdle.suppressed=true` and all prior question/continuation checks green. `npm run test:focused:session-plugin` passes 18/18. Strict OpenSpec validation and path-scoped diff checks pass.
- **Outcome:** The exact r11 terminal-state regression is corrected at the owning controller boundary. Integrated selftest r10 is unlocked; installed and configured calls remain locked.
- **Reason:** A passed root no longer mutates merely because OpenCode repeats idle/status-idle events, while non-synthetic human input still starts a new active revision through the pre-existing path.
- **Do-Not-Repeat Condition:** Do not add terminal-state exceptions to the mission executor, weaken its `guardState === passed` requirement, or rerun configured r11.
- **Evidence-Based Retry Condition:** Run integrated selftest r10 with zero provider calls. Only all finalizer/observer/certificate/gate/cleanup checks green may unlock installed provider-free preflight r22.

## 2026-08-25 - Terminal-state integrated selftest r10 completed

- **Objective:** Revalidate the integrated finalizer and observer after the production guard-state correction.
- **Approach:** Run integrated selftest r10 against candidate `add-autonomous-roadmap-mission-runtime-r12` without an OpenCode server or provider.
- **Evidence:** `evidence-task-4-1-integrated-finalizer-selftest-r10/evaluation.json` is `complete` with `liveCalls=0`; certificate issuer, operation gate, controller buffer, marker, result, state, observer terminality, and cleanup checks are all true.
- **Outcome:** Exactly one installed provider-free preflight r22 is unlocked. Configured calls remain locked.
- **Reason:** The Product Candidate mutation leaves all integrated non-live finalization owners coherent.
- **Do-Not-Repeat Condition:** Do not rerun selftest r10 or bypass the installed provider-free rung.
- **Evidence-Based Retry Condition:** Run preflight r22 once under the accepted isolated OpenCode 1.18.22 environment. Only terminal durable state, terminal PTY, exact route, zero model calls, and complete cleanup may unlock one causally distinct configured capture r12.

## 2026-08-25 - Terminal-state installed preflight r22 completed

- **Objective:** Re-prove the installed slash/cockpit/controller boundary after correcting terminal passed-state stability.
- **Approach:** Run one provider-free preflight r22 under the accepted isolated OpenCode 1.18.22, direct proof-owned database, exact `openai/gpt-5.6-sol`/`xhigh` route, and 180-second readiness envelope.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r22/evaluation.json` is `complete` with `liveCalls=0`; commands, six idle API shapes, mission eligibility, installed slash boundary, cockpit PTY finalization, server isolation, no-model-call, and cleanup checks are all true.
- **Outcome:** The configured live-attempt gate is clear for exactly one causally distinct capture r12 against candidate `add-autonomous-roadmap-mission-runtime-r12`.
- **Reason:** r11 and its replay are terminal; the exact passed-to-settling regression is corrected; focused controller proof, integrated selftest r10, and installed preflight r22 are green without provider calls. This candidate can now reach terminal-clear where r11 could not.
- **Do-Not-Repeat Condition:** Do not rerun r22, alter provider/model/profile/version/auth/timeouts, attach to host `4096`, or schedule an unchanged successor after r12.
- **Evidence-Based Retry Condition:** Run configured capture r12 once, close every process, and replay its preserved bundle offline. Only complete apply/archive/readback/local commit, terminal certified guard, cleanup, and zero remote effects may close task 4.1.

## 2026-08-25 - Configured r12 passed the guard and stalled at archive launch

- **Objective:** Complete the exact installed one-slice mission after correcting r11's terminal-state regression.
- **Approach:** Run one configured capture r12 against the green r22 environment, preserve the full bundle, and close all correlated processes on the first terminal outcome.
- **Evidence:** `evidence-task-4-1-integrated-capture-r12/evaluation.json` is terminal `blocked` with 10 completed exact-route responses. The completion guard accepted the certificate and remained `passed`; executor result is `completed`, `errorClass=none`, `writerClosure=terminal`, apply verification is `all_done`, validation status is zero, and runtime inspection is `clear`. Durable mission state then remained `running` at `lastTransitionKind=archive-launch` with `activeOperation.kind=archive` until the integrated observer timeout. The capture reports complete process/session cleanup and isolated server; archive readback, checkpoint, marker validation, controller terminality, and the no-remote evaluator check are false because finalization did not complete.
- **Outcome:** The r11 Product Candidate defect is closed at the live boundary. Task 4.1 remains open on a new downstream archive-process/finalization blocker.
- **Reason:** The controller reached archive only after terminal-clear succeeded, but did not record an archive exit or transition before the bounded observer stopped the mission. The preserved bundle does not yet distinguish a hung archive child, lost child-exit callback, or archive command boundary failure.
- **Do-Not-Repeat Condition:** Do not rerun r12, change provider/model/timeouts, weaken archive/checkpoint/no-remote checks, or infer a remote effect from the incomplete evaluator row.
- **Evidence-Based Retry Condition:** Replay r12 offline, then diagnose archive launch provider-free using the existing controller/fixture boundary and exact child lifecycle evidence. Another configured capture remains blocked.

## 2026-08-25 - Configured r12 offline replay completed

- **Objective:** Complete all reachable evaluator/finalizer work against the preserved r12 observations before diagnosing archive behavior.
- **Approach:** Replay the r12 capture bundle without an OpenCode server or provider.
- **Evidence:** `evidence-task-4-1-integrated-capture-replay-r12/evaluation.json` is terminal `blocked`, matches the capture checks, and replay made `liveCalls=0`.
- **Outcome:** The r12 replay chain is terminal. The live-attempt gate remains blocked on the archive-launch failure chain.
- **Reason:** Offline evaluation cannot supply the missing archive child exit/readback/checkpoint observations.
- **Do-Not-Repeat Condition:** Do not rerun r12 capture or replay, or fix only an evaluator row while archive liveness remains unknown.
- **Evidence-Based Retry Condition:** Name the owning archive-process cause using source plus a bounded provider-free reproducer that observes child spawn, stdout/stderr, exit, durable transition, and cleanup. Correct only that owner, then re-prove the affected non-live and installed provider-free gates.

## 2026-08-25 - Direct archive diagnostic r1 lost post-child evidence

- **Objective:** Isolate the r12 archive boundary without OpenCode or provider calls on an equivalent disposable OpenSpec fixture.
- **Approach:** Run `openspec-archive.ts` as a bounded child, capture phase stdout/stderr and exit, then read active/archive/validation/remote facts and remove the fixture.
- **Evidence:** `evidence-task-4-1-archive-direct-r1/evaluation.json` is `blocked` with `liveCalls=0` and complete fixture/process cleanup. The archive child returned before the 60-second bound, but the diagnostic's post-child `openspec list --json` used raw Windows `spawnSync` instead of the repository portable command resolver, returned `status=null`, and entered catch before persisting the already-collected child result.
- **Outcome:** Proof Runner defect only; no archive Product Candidate conclusion is supported by r1.
- **Reason:** The one-off runner did not resolve the `.cmd` wrapper using the same mechanism as production and assigned raw evidence too late.
- **Do-Not-Repeat Condition:** Do not rerun r1, interpret its false no-remote/validation rows, or change production archive behavior from this bundle.
- **Evidence-Based Retry Condition:** Use `runPortableCommand` for post-child commands and persist archive child exit/stdout/stderr before readback. Run one provider-free direct r2 with the same fixture and timeout.

## 2026-08-25 - Direct archive diagnostic r2 completed

- **Objective:** Determine whether real OpenSpec archive/readback itself hangs outside the installed mission controller.
- **Approach:** Run the corrected bounded direct diagnostic against a disposable complete change with real `openspec-archive.ts`, real OpenSpec CLI, before/after validation, archive readback, Git remote inspection, and cleanup.
- **Evidence:** `evidence-task-4-1-archive-direct-r2/evaluation.json` is `complete` with `liveCalls=0`. The archive child exited zero in 10.085 seconds; status, strict validation, official archive, post-archive OpenSpec validation, project validation, active-change readback, one archive directory, no Git remotes, and cleanup all passed. No matching process remains.
- **Outcome:** A general OpenSpec archive or nested Bun/CLI process hang is falsified. r12's blocker depends on an integrated-fixture or controller-specific condition.
- **Reason:** The same production archive CLI and real OpenSpec executable complete normally when project validation remains valid after the change directory moves.
- **Do-Not-Repeat Condition:** Do not rerun r2 or change production archive orchestration from a generic CLI-hang hypothesis.
- **Evidence-Based Retry Condition:** Re-run the direct diagnostic once with the exact integrated validation dependency on active `openspec/changes/change-a/tasks.md`. Preserve whether it exits promptly with a post-archive validation error or remains live.

## 2026-08-25 - Direct archive diagnostic r3 reproduced after-move validation failure

- **Objective:** Determine whether r12's exact integrated validation remains valid after official archive moves the change directory.
- **Approach:** Run the same bounded direct archive diagnostic with validation that requires the active `openspec/changes/change-a/tasks.md` path before and after archive.
- **Evidence:** `evidence-task-4-1-archive-direct-r3/evaluation.json` is terminal `blocked` with `liveCalls=0`. Official archive completed and active/archive readback is correct, but the child exited 1 in 18.110 seconds because post-archive project validation raised `ENOENT` for the moved active tasks path. Stderr preserves the complete archive phase chain and original Node stack. No remote exists and cleanup is complete.
- **Outcome:** Exact root cause established. r12's archive child was finite; the fixture oracle became invalid after archive, and the controller then allowed the resulting exception to escape while durable state remained `running/archive-launch`.
- **Reason:** Integrated validation encoded an active-change location rather than the same task evidence in either active or archived ownership. `executeOwned` records `archive-launch` before synchronous archive, but has no failure transition around the completed archive/readback boundary.
- **Do-Not-Repeat Condition:** Do not rerun r3, increase archive/observer timeouts, or classify r12 as a live-child hang.
- **Evidence-Based Retry Condition:** Make the fixture validator resolve exactly one active-or-archived task artifact, persist archive-boundary failures as terminal blocked with no active operation while rethrowing the original cause, and add the exact provider-free controller regression before any installed/live rung.

## 2026-08-25 - Archive failure persistence passed controller campaign r4

- **Objective:** Prove the production controller closes a completed-but-failed archive boundary without losing its cause or leaving unknown liveness.
- **Approach:** Extend the existing provider-free controller campaign with a disposable archive that moves the change and then fails post-archive project validation; require exit 1, preserved cause, durable `terminal-stop/blocked`, and `activeOperation=null` alongside all prior retry/checkpoint/archive invariants.
- **Evidence:** `evidence-task-4-1-controller-campaign-r4/evaluation.json` is `complete`. Raw evidence reports `archiveFailure.activeOperationCleared=true`, `causePreserved=true`, `disposition=blocked`, and `transition=terminal-stop`. Existing two-slice archive, replay, bounded retry, local scoped commit with hook/no push, external checkpoint, and protected-successor checks remain green; cleanup is complete.
- **Outcome:** The production durable failure-state correction is accepted provider-free. The integrated active-or-archived validation oracle still requires its own selftest before installed preflight.
- **Reason:** A finite archive process failure now produces a terminal durable state and retains the original post-archive validation diagnostic instead of appearing live indefinitely.
- **Do-Not-Repeat Condition:** Do not rerun campaign r4 or weaken archive success/readback/checkpoint requirements.
- **Evidence-Based Retry Condition:** Extend integrated selftest to execute its generated validation once with the task active and once after moving the same checked task into one archive directory. Only both zero exits plus prior finalizer checks may unlock installed preflight.

## 2026-08-25 - Active-or-archived validation selftest r11 completed

- **Objective:** Prove the exact integrated validation oracle remains valid across official archive ownership movement.
- **Approach:** Generate the integrated fixture, check its task and marker, run `node tools/validate.mjs` while active, move the same change to one dated archive directory, run validation again, and retain all prior finalizer/observer checks.
- **Evidence:** `evidence-task-4-1-integrated-finalizer-selftest-r11/evaluation.json` is `complete` with `liveCalls=0`; `validationAcrossArchive=true` and certificate issuer, operation gate, controller buffer, marker/result/state preservation, observer terminality, and cleanup are all true.
- **Outcome:** The exact fixture-oracle correction is accepted provider-free. One installed provider-free preflight r23 is unlocked; configured calls remain locked.
- **Reason:** Validation now resolves exactly one checked task artifact from either active or archived ownership and rejects zero/multiple matches.
- **Do-Not-Repeat Condition:** Do not rerun selftest r11 or relax exact-one task resolution.
- **Evidence-Based Retry Condition:** Run installed preflight r23 once against candidate `add-autonomous-roadmap-mission-runtime-r13`. Only all existing slash/cockpit/route/isolation/cleanup checks green with zero model calls may unlock one configured capture r13.

## 2026-08-25 - Archive-corrected installed preflight r23 completed

- **Objective:** Re-prove the installed slash/cockpit/controller boundary after archive failure persistence and fixture validation corrections.
- **Approach:** Run one provider-free preflight r23 under the accepted isolated OpenCode 1.18.22 environment, exact route, direct proof-owned database, non-perturbing observer, and 180-second readiness bound.
- **Evidence:** `evidence-task-4-1-integrated-preflight-r23/evaluation.json` is `complete` with `liveCalls=0`; commands, idle APIs, mission eligibility, slash boundary, PTY finalization, server isolation, no-model-call, and cleanup checks are all true.
- **Outcome:** The configured live-attempt gate is clear for exactly one causally distinct capture r13 against candidate `add-autonomous-roadmap-mission-runtime-r13`.
- **Reason:** r12 and its replay are terminal; direct diagnostics r2/r3 separated CLI health from the exact fixture failure; controller campaign r4, integrated selftest r11, and installed preflight r23 are green. The candidate can now progress past both r11 guard terminality and r12 post-archive validation/failure-state blockers.
- **Do-Not-Repeat Condition:** Do not rerun r23, alter provider/model/profile/version/auth/timeouts, attach to host `4096`, or schedule an unchanged successor after r13.
- **Evidence-Based Retry Condition:** Run configured capture r13 once, close every process, and replay its preserved bundle offline. Only complete apply/archive/readback/local commit, certified terminal guard, cleanup, and no remote effects may close task 4.1.

## 2026-08-25 - Configured r13 completed product outcome with one unqualified observer absence

- **Objective:** Complete the installed one-slice mission after guard, archive-oracle, and archive-failure-state corrections.
- **Approach:** Run one configured capture r13 against the green r23 environment, preserve the full bundle, close all processes, and inspect every raw acceptance fact.
- **Evidence:** `evidence-task-4-1-integrated-capture-r13/evaluation.json` is `blocked` only on `markerValidated`. Raw evidence records 10 completed exact-route responses; exact `alpha\n` marker; apply verification `validationStatus=0`; certified `guardState=passed`; executor terminal/clean; archive readback with zero active changes and one dated archive; durable `disposition=complete`, `activeOperation=null`, `terminal-stop`; local checkpoint with the exact mission subject; controller PTY exit 0; no remotes; two deleted roots; isolated server; and complete cleanup. The redundant post-run validation observation is only `validationExit=null`; the runner did not preserve its error, signal, stdout, or stderr, so this absence source is unqualified.
- **Outcome:** The accepted Product Candidate behavior is directly observed complete. Task 4.1 remains open only on evaluator/proof-runner closure of the unqualified redundant validation row.
- **Reason:** The same generated validator already passed apply validation and the archive command's mandatory before/after validation before the controller could archive, checkpoint, and reach complete. A later status-null observation without diagnostics cannot establish a Product Candidate failure.
- **Do-Not-Repeat Condition:** Do not rerun r13, repeat model work to reacquire a redundant validation, or waive exact marker/archive/checkpoint/no-remote facts.
- **Evidence-Based Retry Condition:** Replay r13 offline, preserve full final-validation diagnostics for future captures, prove the generated validator after archive plus local checkpoint provider-free, and update the evaluator to accept the composed complete path only when exact marker, apply validation zero, durable complete, archive readback, and local checkpoint are all present.

## 2026-08-25 - Configured r13 initial offline replay remained evaluator-blocked

- **Objective:** Close the existing evaluator chain against r13 raw evidence without another live invocation.
- **Approach:** Replay the unchanged r13 bundle before evaluator correction.
- **Evidence:** `evidence-task-4-1-integrated-capture-replay-r13/evaluation.json` is terminal `blocked` with `liveCalls=0` and reproduces the single false `markerValidated` row.
- **Outcome:** Replay is deterministic; live gate remains blocked and no new capture is needed for the known raw facts.
- **Reason:** The original evaluator requires only `repository.validationExit===0` and cannot use the stronger already-preserved composed completion evidence.
- **Do-Not-Repeat Condition:** Do not rerun this unchanged replay or the configured capture.
- **Evidence-Based Retry Condition:** Correct the evaluator and its provider-free selftest, then replay the preserved r13 bundle to a new evidence root. A green replay may close task 4.1 without model calls because the mutation is evaluator-only.

## 2026-08-25 - r13 evaluator closure completed and task 4.1 reached MVP

- **Objective:** Close the unqualified redundant validation observation without repeating the configured mission.
- **Approach:** Preserve full error/signal/stdout/stderr for future final-validation observations; extend integrated selftest through active validation, archive move, local checkpoint commit, and post-checkpoint validation; evaluate preserved r13 using exact marker plus apply validation zero plus durable complete/archive/checkpoint evidence when the redundant final status is absent.
- **Evidence:** `evidence-task-4-1-integrated-finalizer-selftest-r12/evaluation.json` is `complete` with `liveCalls=0` and `validationAcrossArchive=true`. `evidence-task-4-1-integrated-capture-replay-r13-evaluator-r1/evaluation.json` is `complete`; all 12 checks are true, including marker validation, archive/readback, local checkpoint, certified executor, terminal controller, no remote, isolation, session cleanup, and visible cockpit. Replay drove zero calls against the unchanged r13 raw bundle, whose capture recorded 10 completed exact-route responses.
- **Outcome:** Task 4.1 is complete and the current candidate reaches `Development-Stage: MVP` for the one-slice accepted happy path. No new configured invocation was needed after r13.
- **Reason:** Product behavior was already complete in r13; the evaluator correction uses only mutually reinforcing raw facts that production requires before durable complete and does not weaken any archive, validation, checkpoint, marker, remote, or cleanup check.
- **Do-Not-Repeat Condition:** Do not rerun configured r13, its initial replay, selftest r12, or the corrected replay. Do not generalize one-slice proof to auto-chain or failure lanes.
- **Evidence-Based Retry Condition:** Proceed to task 4.2's distinct two-slice auto-chain boundary only after its provider-free queue/ordering preflight and exact evidence plan are current.

## 2026-08-25 - Task 4.2 offline inventory named the missing observation

- **Objective:** Determine whether existing queued-active, controller campaign, provider-simulate, configured-provider, and installed one-slice evidence already closes task 4.2 without another configured attempt.
- **Approach:** Compare task 1.2 queued-active `r3`, controller campaign `r4`, provider simulate/campaign `r3`/`r4`, configured campaign `r6`, installed one-slice `r13`, current source ordering, and task 4.2's exact `propose` then `continue` boundary.
- **Evidence:** Task 1.2 proves an exact clean dormant queued active is eligible and unknown ownership blocks. Provider simulation and controller campaign prove archive/checkpoint before successor activation, but their order is `continue` then `propose`. Configured `r6` completed that first `continue`, then entered `propose` and blocked without terminal second-root evidence. Installed `r13` proves only one `continue` root and cockpit. No bundle combines a first `propose`, a later already-active `continue`, two distinct configured roots, one ordered successor activation, terminal queue exhaustion, and installed cockpit correlation.
- **Outcome:** The exact missing model-only observation is named; no configured attempt is unlocked yet. Extend the existing provider proof owner with a provider-free `two-slice` scenario ordered `propose` then `continue`, with `change-a` active and dormant from initial preflight, exact archive/checkpoint/activation ordering, no third outcome, fresh-root evaluator facts, external-directory denial, and complete cleanup.
- **Reason:** Existing evidence is complementary but not equivalent to the required order/population. Reusing the oversized `r6` campaign or composing one-slice and reverse-order evidence would overclaim task 4.2.
- **Do-Not-Repeat Condition:** Do not rerun configured `r6`, treat its partial second call as completion, reverse task 4.2's required order, enable external-directory access, or launch an installed/configured two-slice attempt from inventory alone.
- **Evidence-Based Retry Condition:** First obtain create-new provider-free two-slice preflight and simulation bundles that prove queued-active eligibility, exact `propose`/`continue` order, two archives/checkpoints, exactly one successor activation, terminal complete, no third outcome, state replay, and cleanup. Then make the installed two-slice selftest/preflight evidence plan current; only those green gates may unlock one bounded configured capture.

## 2026-08-25 - Task 4.2 provider-free queue and ordering gate completed

- **Objective:** Prove the exact task 4.2 mission shape before changing or invoking the installed OpenCode boundary.
- **Approach:** Extend the existing provider proof owner with a `two-slice` scenario ordered `change-b/propose` then `change-a/continue`; keep `change-a` active from initial preflight; require exact command order, exactly one successor activation, no protected/third slice, terminal queue exhaustion, and distinct configured session roots when capture is eventually used. Restore the proof fixture's documented external-directory denial and run provider-free preflight/simulation plus both existing scenario regressions.
- **Evidence:** `evidence/task-4-2-provider-two-slice-preflight-r1/preflight.json` is `complete` with `modelCalls=0`; it reports first eligible `change-b/propose` and exact queued active set `change-a`. `evidence/task-4-2-provider-two-slice-simulate-r1/evaluation.json` is `complete`: two deterministic executions in `propose`/`continue` order, two archives/checkpoints, three controller processes, one bounded local recovery, one successor activation, terminal `complete` at cursor 1, valid 17-transition state replay with clear writer, no third/protected slice, and cleanup complete. Fresh temp one-slice `r2` and campaign `r5` regressions are also `complete`.
- **Outcome:** The provider-free queue/ordering gate is accepted. Task 4.2 remains open because configured fresh-root behavior and installed slash/cockpit correlation are not yet observed. No configured call is unlocked yet.
- **Reason:** This is the first evidence matching the required order and queued-active population; simulation intentionally cannot establish configured root identity or installed cockpit behavior.
- **Do-Not-Repeat Condition:** Do not rerun these provider-free bundles, infer configured root isolation from `rootIsolation=not-proven`, or launch the configured scenario before the installed two-slice selftest/preflight and evaluator are green.
- **Evidence-Based Retry Condition:** Extend the existing integrated proof runner rather than adding another runner. Its provider-free selftest must prove two active-or-archived task oracles, two marker/checkpoint stages, exact transition ordering, and evaluator finalization; its installed preflight must prove initial queued eligibility plus slash/cockpit/controller lifecycle with zero model calls and complete cleanup. Only then may one bounded configured two-slice capture run.

## 2026-08-25 - Task 4.2 integrated two-slice selftest completed

- **Objective:** Extend the existing installed-boundary proof owner with a provider-free two-slice finalizer/evaluator selftest while preserving the default one-slice behavior.
- **Approach:** Add scenario-aware active-or-archived task, marker, result, and transition capture; synthesize `change-b/propose` then `change-a/continue`; require exact finalization order and queue exhaustion; then run one create-new one-slice regression.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-selftest-r1/evaluation.json` is terminal `complete` with `liveCalls=0`. It preserves two checked task oracles, exact `alpha\n` and `beta\n` markers, two distinct hashed root refs, six green active/archive/checkpoint validations, terminal cleanup, `activeOperation=null`, cursor 1 queue exhaustion, and exact `archive/checkpoint/successor-activation/archive/checkpoint/terminal-stop` order. The disposable one-slice regression at `C:\Users\noilw\AppData\Local\Temp\opencode\roadmap-integrated-one-slice-regression-r1` is also terminal `complete` with `liveCalls=0`.
- **Outcome:** The offline integrated evaluator/finalizer gate is accepted without a model or installed OpenCode server. One create-new installed two-slice preflight with zero model calls is unlocked; configured capture remains locked.
- **Reason:** The integrated runner now proves the exact two-stage artifact/finalization oracle needed to interpret an installed capture, while the unchanged default scenario remains green.
- **Do-Not-Repeat Condition:** Do not rerun either selftest on the unchanged candidate or infer installed cockpit/model-root facts from synthetic evidence.
- **Evidence-Based Retry Condition:** Run one create-new `--mode preflight --scenario two-slice`, preserve and inspect its raw/evaluation bundle, and proceed to configured capture only if every installed slash/cockpit/controller/isolation/queued-active/cleanup check is green with zero model calls.

## 2026-08-25 - Task 4.2 installed preflight and offline replay completed

- **Objective:** Close the installed zero-model slash/cockpit/controller gate and replay every current two-slice evaluator/finalizer bundle before a configured call.
- **Approach:** Run one isolated OpenCode 1.18.22 preflight with the exact `quality-independent` route and two-slice scenario; extract the existing preflight/selftest checks into replayable evaluators; replay both preserved raw bundles to create-new evidence roots.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-preflight-r1/evaluation.json` is terminal `complete` with `liveCalls=0`: required commands and idle APIs loaded, route is `openai/gpt-5.6-sol/xhigh`, first eligible is `change-b/propose`, exact queued active set is `change-a`, cockpit/controller reaches durable `paused` before a model root, the server is isolated, and cleanup is complete. `evidence/task-4-2-integrated-two-slice-selftest-replay-r1/evaluation.json` and `evidence/task-4-2-integrated-two-slice-preflight-replay-r1/evaluation.json` are both terminal `complete` with zero live calls.
- **Outcome:** The task 4.2 live-attempt gate is clear for exactly one causally distinct configured two-slice capture against candidate `add-autonomous-roadmap-mission-runtime-r13`.
- **Reason:** Provider-free queue/order, synthetic finalization/evaluator, installed slash/cockpit/controller, route/isolation, no-model, cleanup, and offline replay prerequisites are all current and terminal.
- **Do-Not-Repeat Condition:** Do not rerun the preflight/selftest/replays, alter provider/model/profile/version/auth/timeouts, attach to host `4096`, reverse slice order, or launch an unchanged successor after the configured attempt.
- **Evidence-Based Retry Condition:** Run one configured `--mode capture --scenario two-slice`, preserve and inspect the complete raw bundle, close every process/session/PTY/fixture, and replay that bundle offline. Only exact two-root provider execution, artifact/archive/checkpoint order, queue exhaustion, no third outcome, certified terminal guards, isolation, no remote, and cleanup may close task 4.2.

## 2026-08-25 - Task 4.2 capture evaluator selftest completed

- **Objective:** Ensure the one configured attempt cannot finish with an evaluator-only gap around checked task artifacts or the two-slice capture verdict.
- **Approach:** Require both active-or-archived `tasks.md` oracles to contain checked task 1.1, feed the synthetic finalizer state through the actual configured-capture evaluator, and replay the create-new selftest bundle.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-selftest-r2/evaluation.json` and `evidence/task-4-2-integrated-two-slice-selftest-replay-r2/evaluation.json` are terminal `complete` with zero real live calls. The preserved nested capture evaluation has all 17 configured-capture checks true, including `taskArtifacts`, two fresh roots, provider execution shape, exact ordering, queue exhaustion, no third outcome, isolation, no remote, and cleanup.
- **Outcome:** The configured capture evaluator itself is now provider-free proven and replayable. The single configured two-slice attempt remains unlocked.
- **Reason:** The earlier selftest proved finalization facts but did not execute the complete configured-capture evaluator; this causally distinct evaluator selftest closes that interpretation risk before model use.
- **Do-Not-Repeat Condition:** Do not rerun r2 or its replay unless the two-slice capture evaluator or synthetic finalizer shape changes.
- **Evidence-Based Retry Condition:** Proceed with the already-authorized single configured capture; preserve and replay its raw bundle before any classification or successor attempt.

## 2026-08-25 - Configured two-slice capture r1 timed out in first propose command

- **Objective:** Prove the installed configured `change-b/propose` then queued `change-a/continue` campaign through two fresh roots, archives, checkpoints, and terminal queue exhaustion.
- **Approach:** Run the single unlocked capture with OpenCode 1.18.22, `openai/gpt-5.6-sol`, profile `quality-independent`, variant `xhigh`, the fixed 300-second command limit, isolated loopback server/database/config, and the disposable two-slice repository.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r1/raw.json` preserves 28 completed exact-route responses and one aborted response on the first root. The model created `change-b`, proposal/spec/design/tasks/history, passed the propose gate, strict OpenSpec validation, apply gate, and project validation, but the executor then reached its unchanged 300000 ms limit before terminal completion. Its structured result is `transient`, `guardState=unknown`, `writerClosure=terminal`, `cleanup=complete`; durable state is `paused`, cursor 0, `activeOperation=null`; the controller PTY exited 1; two roots were deleted; server/fixture cleanup is complete. The second slice never launched. The runner then recorded a secondary `ENOENT` while assuming `slice-a/result.json` existed. `evidence/task-4-2-integrated-two-slice-capture-replay-r1/evaluation.json` is terminal `blocked` with zero replay calls and reproduces the incomplete campaign.
- **Outcome:** Task 4.2 remains open. This attempt does not establish two-slice auto-chain, fresh second root, archives/checkpoints, queue exhaustion, or no-third-outcome. Live/configured attempts are blocked.
- **Reason:** The full spec-driven proposal workflow required more than the fixed command envelope despite reaching readiness; this is a contained configured-path limitation, not evidence for increasing product/model/command timeouts. The missing-slice `ENOENT` is a separate proof-runner partial-capture defect.
- **Do-Not-Repeat Condition:** Do not rerun r1, increase command/model/product timeouts, compose its partial first root with another bundle, treat generated artifacts as command completion, or launch another configured attempt while the gate is blocked.
- **Evidence-Based Retry Condition:** First make partial captures preserve only existing slice results without throwing. Then use provider-free evidence to prove a causally distinct fixture/workflow mechanism that materially reduces proposal work while retaining a real `propose` command, exact queued active set, all evaluator invariants, and unchanged timeouts; replay every affected evaluator/finalizer bundle and run a fresh installed zero-model preflight before considering one new bounded configured attempt.

## 2026-08-25 - Causally distinct single-plan fixture passed provider-free gates

- **Objective:** Remove r1's observed proposal-work bottleneck without changing production/model/command timeouts, route, skill, gates, archive semantics, or task 4.2's real `propose` boundary.
- **Approach:** Use OpenSpec 1.10's project-local schema support in only the disposable two-slice fixture. The new `proof-minimal` schema has one apply-required `plan` artifact whose instruction still requires proposal, synthetic-beta delta spec, tasks, and strategy history in one concise edit. Extract existing-result/repository capture owners and challenge them with the second result and alpha marker temporarily absent.
- **Evidence:** OpenSpec source resolves project-local schemas before user/package schemas. `evidence/task-4-2-integrated-two-slice-selftest-r4/evaluation.json` and `evidence/task-4-2-integrated-two-slice-selftest-replay-r4/evaluation.json` are terminal `complete` with zero live calls. Checks prove schema `proof-minimal`, exactly one `plan` artifact, propose/apply operation gates zero, strict validation zero, actual 17-check capture evaluator complete, partial capture preserves only `slice-b` with missing alpha marker and validation exit 1 instead of throwing, full two-slice finalization, and cleanup. Disposable one-slice regression `C:\Users\noilw\AppData\Local\Temp\opencode\roadmap-integrated-one-slice-regression-r2` is terminal `complete`.
- **Outcome:** The causally distinct provider-free fixture/evaluator/partial-capture gate is accepted. A fresh installed two-slice zero-model preflight is the next required rung; configured calls remain blocked.
- **Reason:** r1's raw trace spent 28 responses traversing four separate default artifact instructions. The local single-plan graph preserves the same required planning artifacts and real command/gate/archive behavior while structurally reducing artifact traversal to one instruction.
- **Do-Not-Repeat Condition:** Do not rerun selftest r4/replay or one-slice r2 unless schema/evaluator/capture ownership changes, and do not treat provider-free graph reduction as configured timing proof.
- **Evidence-Based Retry Condition:** Run one create-new installed `--mode preflight --scenario two-slice`, require the exact queued active set, route, cockpit/controller, resolved local schema identity, zero model calls, and cleanup, then replay it offline. Only those green facts may reopen one bounded configured attempt.

## 2026-08-25 - Single-plan installed preflight r2 reopened one configured attempt

- **Objective:** Prove the changed fixture is loaded at the real installed slash/cockpit/controller boundary before another configured call.
- **Approach:** Run one isolated OpenCode 1.18.22 zero-model preflight with the exact route and changed two-slice fixture, explicitly resolve and validate `proof-minimal`, then replay the preserved raw bundle offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-preflight-r2/evaluation.json` and `evidence/task-4-2-integrated-two-slice-preflight-replay-r2/evaluation.json` are terminal `complete` with zero live calls. OpenSpec reports first eligible `change-b/propose`, exact queued active `change-a`, project-source schema `proof-minimal`, valid schema/templates, loaded required commands and idle APIs, visible slash/cockpit/controller pause before model creation, isolated server, and complete cleanup.
- **Outcome:** The live-attempt gate is clear for one causally distinct configured capture r2 against candidate `add-autonomous-roadmap-mission-runtime-r13`.
- **Reason:** r1's timeout mechanism was default four-artifact traversal; r2 uses one project-local plan artifact while preserving all required planning files, gates, strict validation, command sequence, product timeout, route, and cleanup boundaries.
- **Do-Not-Repeat Condition:** Do not rerun preflight r2/replay, change timeouts/route/version/auth, attach to host `4096`, or schedule an unchanged successor after capture r2.
- **Evidence-Based Retry Condition:** Run configured capture r2 once, preserve and inspect all raw facts, close every writer/process/session/PTY/fixture, and replay offline before classification. Only a complete two-root campaign may close task 4.2.

## 2026-08-25 - Configured r2 completed first root and exposed fixture archive incompatibility

- **Objective:** Re-run the exact configured campaign with the provider-free-proven single-artifact proposal graph and unchanged runtime limits.
- **Approach:** Use one project-local `plan` artifact while preserving the required proposal/spec/tasks/history files, then run real `opsx-propose`, `opsx-apply`, controller archive, and successor sequencing.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r2/raw.json` preserves 43 completed exact-route responses with no provider error. `change-b` propose and apply phases both completed; apply verification is all-done with validation zero; both completion guards passed; the executor result is completed/terminal/clean; beta task and exact marker are complete. The controller reached `archive-launch`, then persisted `terminal-stop/blocked` with `activeOperation=null`; no archive or second root occurred. Three roots were deleted, remotes are empty, and cleanup is complete. Partial-capture preservation produced repository/result facts without `ENOENT`. Offline `evidence/task-4-2-integrated-two-slice-capture-replay-r2/evaluation.json` is terminal `blocked` with zero replay calls.
- **Outcome:** The fixed command-timeout blocker from r1 is closed, but task 4.2 remains open at the archive boundary. Live/configured attempts are blocked.
- **Reason:** The fixture named its single artifact `plan`; production `openspec-archive.ts` requires the tracked `tasks.md` artifact under status key `tasks`, so a complete custom artifact with another id cannot pass its exact-one task-path gate. This is avoidable without production semantics: retain one artifact but name it `tasks`, matching the archive wrapper's existing contract.
- **Do-Not-Repeat Condition:** Do not rerun r2, compose its completed first root with another bundle, weaken archive/readback, change production archive semantics, or launch another configured attempt before exact provider-free archive proof and all affected replays/preflight are green.
- **Evidence-Based Retry Condition:** Rename the disposable schema's sole artifact to `tasks`, make integrated selftest invoke the actual production archive wrapper (not a manual move), require official archive plus before/after validation and partial-capture checks, replay it, then run a fresh installed zero-model preflight/replay. Only that causally corrected archive path may reopen a bounded configured attempt.

## 2026-08-25 - Exact production archive selftest r5 completed

- **Objective:** Close r2's archive blocker through the exact production archive wrapper without changing production semantics.
- **Approach:** Keep the one-artifact graph but use artifact id `tasks`, then run the real `global/bin/openspec-archive.ts` over the complete custom-schema beta change with strict OpenSpec validation and project validation before/after archive. Retain the actual capture evaluator and missing-second-slice challenge.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-selftest-r5/evaluation.json` and `evidence/task-4-2-integrated-two-slice-selftest-replay-r5/evaluation.json` are terminal `complete` with zero live calls. Raw facts record `betaArchive=0`, active/archive/checkpoint validations all zero, schema/gates/strict validation green, exact two-stage artifacts/transitions, actual 17-check capture evaluator complete, partial capture preserved without throw, and cleanup complete.
- **Outcome:** The exact provider-free archive path is accepted. A fresh installed zero-model preflight/replay remains required before any configured attempt can reopen.
- **Reason:** The sole fixture incompatibility was the artifact key; matching the archive wrapper's existing `tasks` contract preserves the single-instruction proposal mechanism while allowing official archive/readback.
- **Do-Not-Repeat Condition:** Do not rerun selftest r5/replay or alter production archive behavior on this evidence.
- **Evidence-Based Retry Condition:** Run one changed-fixture installed preflight, require local schema resolution, exact queue, route, no model call, cockpit/controller, cleanup, and terminal offline replay. Only then may one bounded configured attempt be considered.

## 2026-08-25 - Proposal verification and archive evaluator selftest r6 completed

- **Objective:** Remove the remaining false `proposal-artifacts-incomplete` row observed in configured r2 without weakening proposal verification.
- **Approach:** Keep only `tasks` apply-required with no dependencies, but declare the conventional `proposal`, `specs`, and `design` identities outside that required closure. The single tasks instruction creates all four files in one edit. Add `proposalVerified` to the configured evaluator and require eligible/all-artifacts-complete/validation-zero.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-selftest-r6/evaluation.json` and `evidence/task-4-2-integrated-two-slice-selftest-replay-r6/evaluation.json` are terminal `complete` with zero live calls. Nested capture evaluation has all 18 checks true including `proposalVerified`; status has four completed conventional artifacts with only `tasks` apply-required; actual production beta archive and all before/after/checkpoint validations are zero; partial capture and cleanup remain green.
- **Outcome:** The exact provider-free proposal-verification/archive/evaluator chain is accepted. Because the schema shape changed after preflight r3, a fresh installed zero-model preflight/replay is still required; configured calls remain blocked.
- **Reason:** r2 proved the one-instruction model path fits the fixed envelope, but its custom artifact identity did not satisfy the executor's existing conventional verification contract. Declaring those identities while keeping them outside the required traversal closes the oracle without restoring the four-step bottleneck.
- **Do-Not-Repeat Condition:** Do not rerun r6/replay or waive proposal verification.
- **Evidence-Based Retry Condition:** Run one fresh changed-schema installed preflight/replay. Only exact route/schema/queue/cockpit/no-model/cleanup green may reopen one bounded configured campaign.

## 2026-08-25 - Final schema installed preflight r4 reopened one configured attempt

- **Objective:** Re-prove the installed zero-model boundary after aligning both proposal verification and archive artifact identities.
- **Approach:** Run the exact changed-schema two-slice fixture through isolated OpenCode 1.18.22 slash/cockpit/controller preflight, verify local schema resolution/validation and queued active state, then replay offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-preflight-r4/evaluation.json` and `evidence/task-4-2-integrated-two-slice-preflight-replay-r4/evaluation.json` are terminal `complete` with zero live calls. Route, commands, idle APIs, first `change-b/propose`, queued `change-a`, project-local valid `proof-minimal`, visible cockpit/controller pause, server isolation, no model root, session/fixture cleanup, and replay are all green.
- **Outcome:** The live-attempt gate is clear for one causally corrected configured capture r3 against candidate `add-autonomous-roadmap-mission-runtime-r13`.
- **Reason:** r1's timeout path and r2's archive/proposal-identity paths are each closed by distinct provider-free and installed evidence; r2 already proved the single-instruction propose/apply model path completes inside unchanged timeouts.
- **Do-Not-Repeat Condition:** Do not rerun preflight r4/replay, alter route/version/auth/timeouts, attach to host `4096`, or launch an unchanged successor after capture r3.
- **Evidence-Based Retry Condition:** Run capture r3 once, preserve/inspect the raw bundle, close every writer/process/session/PTY/fixture, and replay it offline. Only the complete two-root evaluator may close task 4.2.

## 2026-08-25 - Configured r3 stopped on proposal artifact completeness

- **Objective:** Prove the installed configured `change-b/propose` then queued `change-a/continue` campaign on the final four-identity single-instruction schema.
- **Approach:** Run one isolated OpenCode 1.18.22 capture r3 with `openai/gpt-5.6-sol`, profile `quality-independent`, variant `xhigh`, project-local `proof-minimal` declaring `proposal`/`specs`/`design`/`tasks` and only `tasks` apply-required, unchanged 300-second command limit, disposable repository, local commits, no remote, and no host `:4096` attachment.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r3/evaluation.json` is terminal `blocked` with `liveCalls=41`. Raw evidence records `completion guard did not reach a terminal state; last=auditing certificate=declined:proposal-artifacts-incomplete`, `disposition=terminal`, `guardState=unknown`, `artifactCount=4`, `artifactsComplete=false`, durable `blocked`/`terminal-stop`/cursor 0/`slice-b`, four deleted root sessions, complete cleanup, no archive, and no `slice-a` result. Offline replay has not yet run.
- **Outcome:** Task 4.2 remains open. Live/configured attempts are blocked.
- **Reason:** Proposal verification still declined completeness after the four conventional identities were declared. The exact incomplete artifact identity and its relationship to the files written during the root must be established from preserved evidence before any fixture correction.
- **Do-Not-Repeat Condition:** Do not rerun r3, increase timeouts, waive proposal verification, compose its partial first root, or launch another configured/live attempt while the gate is blocked.
- **Evidence-Based Retry Condition:** Replay r3 offline, extract the exact incomplete artifact identity and written files from the preserved raw bundle, then prove a causally distinct provider-free fixture/workflow against those facts and a fresh installed zero-model preflight/replay before considering one new bounded configured attempt.

## 2026-08-25 - Capture r3 replay identified a contradictory fixture outcome

- **Objective:** Close r3's replay requirement and identify the exact missing raw observation without another provider or live attempt.
- **Approach:** Replay the untouched r3 raw bundle through the current two-slice evaluator, then correlate its command transcript, OpenSpec status, written files, and current fixture source.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-replay-r3/evaluation.json` is terminal `blocked` with zero replay calls. The first command wrote `proposal.md`, `specs/synthetic-beta/spec.md`, `tasks.md`, and `history.md`; status was `3/4` with only `design` ready, and the command returned that `design.md` was intentionally omitted. A later completion-audit cycle wrote `design.md` and reached `4/4`, after the executor had already recorded declined proposal verification. `writeProject` confirms the cause: the slice outcome said to create only proposal/spec/tasks/history while the same schema instruction and verifier required `design.md` too.
- **Outcome:** The exact missing artifact and causal contradiction are established offline. The live/configured gate remains blocked while the fixture correction is proved.
- **Reason:** The model followed the narrower mission outcome over the schema's broader single-instruction planning set; this was a proof-fixture contract conflict, not a production executor or OpenSpec archive defect.
- **Do-Not-Repeat Condition:** Do not omit `design.md` from the mission outcome, rerun r3, weaken proposal verification, or launch a configured successor from replay diagnosis alone.
- **Evidence-Based Retry Condition:** Align the existing two-slice mission outcome with all configured artifact paths, add a provider-free evaluator oracle for that exact outcome, pass create-new two-slice selftest and replay, then pass a fresh installed zero-model preflight and replay before reconsidering one bounded configured attempt.

## 2026-08-25 - Corrected proposal outcome passed provider-free gates

- **Objective:** Eliminate the exact r3 fixture contradiction while preserving the one-instruction proposal graph, conventional artifact verification, official archive path, and unchanged runtime limits.
- **Approach:** Extend the existing integrated fixture outcome to name `proposal.md`, `specs/synthetic-beta/spec.md`, `design.md`, `tasks.md`, and `history.md`; retain only `tasks` as apply-required; capture the exact outcome in raw evidence; and require selftest/preflight evaluators to observe every named path.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-selftest-r7/evaluation.json` and `evidence/task-4-2-integrated-two-slice-selftest-replay-r7/evaluation.json` are terminal `complete` with zero live calls. The new `proposalOutcomeComplete` check is true; `applyRequires=tasks`, `artifactCount=4`, proposal/apply gates, strict validation, official beta archive, partial capture, actual 18-check capture evaluator, transition order, and cleanup all remain green.
- **Outcome:** The causally distinct provider-free correction is accepted. One fresh installed two-slice zero-model preflight and replay is the next required rung; configured calls remain blocked.
- **Reason:** The corrected mission outcome now agrees with the schema instruction and executor verifier without restoring the default four-instruction traversal or changing production semantics.
- **Do-Not-Repeat Condition:** Do not rerun selftest r7/replay, remove `design.md` from the outcome, add another proof runner, or treat provider-free success as configured model proof.
- **Evidence-Based Retry Condition:** Run one fresh installed `--mode preflight --scenario two-slice`, require the corrected proposal outcome, exact route/schema/queue, cockpit/controller, zero model calls, isolation, cleanup, and terminal offline replay. Only those green facts may clear the configured-attempt gate.

## 2026-08-25 - Corrected-outcome installed preflight r5 reopened one configured attempt

- **Objective:** Prove the aligned proposal outcome is loaded at the installed OpenCode boundary before reconsidering a configured campaign.
- **Approach:** Run one isolated OpenCode 1.18.22 two-slice preflight against candidate `add-autonomous-roadmap-mission-runtime-r13`, exact `openai/gpt-5.6-sol` / `quality-independent` / `xhigh` route, unchanged timeouts, project-local `proof-minimal`, queued `change-a`, and the corrected `change-b` outcome; then replay the preserved bundle offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-preflight-r5/evaluation.json` and `evidence/task-4-2-integrated-two-slice-preflight-replay-r5/evaluation.json` are terminal `complete` with zero live calls. `proposalOutcomeComplete`, route, commands, idle APIs, first `change-b/propose`, exact queued active `change-a`, project-source valid schema, cockpit/controller pause before model creation, server isolation, session/fixture cleanup, and replay are all green.
- **Outcome:** The live-attempt gate is clear for exactly one causally distinct configured capture r4. Task 4.2 remains open until the complete two-root evaluator is green.
- **Reason:** r3's preserved replay identified the narrower outcome as the exact cause of the missing design artifact; the corrected outcome is now green at both provider-free and installed zero-model boundaries while every other fixture/runtime contract remains unchanged.
- **Do-Not-Repeat Condition:** Do not rerun selftest r7, preflight r5, their replays, captures r1/r2/r3, alter route/version/profile/auth/timeouts, attach to host `4096`, or launch an unchanged successor after r4.
- **Evidence-Based Retry Condition:** Run configured capture r4 once, preserve and inspect the complete raw bundle, close every writer/process/session/PTY/fixture, and replay it offline before classification. Only a complete two-root campaign may close task 4.2; any evidence-only failure blocks further live work until its preserved chain is terminally replayed and causally corrected.

## 2026-08-25 - Configured r4 reached apply verification but omitted unfinalized session facts

- **Objective:** Prove the corrected configured two-slice campaign after r3's exact proposal-artifact cause was closed.
- **Approach:** Run the one unlocked configured r4 capture with the green r7/r5 fixture and unchanged OpenCode 1.18.22, exact route/profile/variant, command limits, local-commit envelope, isolation, and cleanup; then replay the preserved raw bundle offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r4/raw.json` records proposal command/verification terminal-green with all four artifacts complete, apply command/verification terminal-green with zero remaining tasks and validation zero, checked beta task, exact `beta\n` marker, queued runtime clear, and isolated server. The integrated runner then reached its 600000 ms durable-state observation bound while durable state remained `session-launch/running`, the controller PTY was still running, and no executor `result.json` existed. Two roots and the fixture were cleaned. Capture and `evidence/task-4-2-integrated-two-slice-capture-replay-r4/evaluation.json` are terminal `blocked`; replay made zero live calls.
- **Outcome:** Task 4.2 remains open and live/configured attempts are blocked. r4 advanced beyond r3 but does not prove executor terminal clearance, archive, successor activation, or queue exhaustion.
- **Reason:** The preserved bundle cannot distinguish an apply-guard stall from the observer/controller wall-clock boundary. Finalization derives provider/guard facts only from a completed executor result's root ref; with no result it stored `providerExecutions=[]` and deleted the unfinalized mission roots without preserving their current guard revision, certificate, messages, or response timing. Therefore `liveCalls=0` and the absent terminal guard are unqualified negative observations, not Product Candidate failure.
- **Do-Not-Repeat Condition:** Do not rerun r4, increase product/model/command/controller timeouts, infer zero provider calls, classify the guard as stuck, or launch another configured attempt from command/verification files alone.
- **Evidence-Based Retry Condition:** Extend only the existing integrated proof finalizer to hydrate and preserve mission-root guard/provider facts independently of `result.json`, prove that observation path with a zero-model positive control plus provider-free selftest/replay and installed preflight/replay, then treat any next configured invocation as one bounded evidence capture until the missing apply-guard observation is acquired.

## 2026-08-25 - Unfinalized-session observation selftest r8 completed

- **Objective:** Prove the new pre-cleanup mission-session evidence shape and evaluator without another installed server or provider call.
- **Approach:** Hydrate mission roots independently of executor result files, retain existing provider/guard message facts per slice, use them as evaluator fallback only when result-derived provider rows are absent, and add a paused grind-disabled zero-response canary with an explicit evaluator check.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-selftest-r8/evaluation.json` and `evidence/task-4-2-integrated-two-slice-selftest-replay-r8/evaluation.json` are terminal `complete` with zero live calls. `missionSessionObservation` is true alongside corrected outcome, four-artifact schema, official archive, partial capture, complete nested capture evaluator, transition order, and cleanup.
- **Outcome:** The provider-free observation shape/evaluator is accepted. One fresh installed zero-model preflight and replay is required to qualify the actual session-list/detail/messages source; configured calls remain blocked.
- **Reason:** r4's missing observation came from finalizer source selection, not evaluator semantics alone. The selftest proves the retained shape and fallback contract before exercising the real local API.
- **Do-Not-Repeat Condition:** Do not rerun selftest r8/replay, infer actual OpenCode session observability from synthetic facts alone, or launch a configured attempt before the installed positive control is green.
- **Evidence-Based Retry Condition:** Run one installed two-slice preflight that creates only a paused grind-disabled mission-session observation canary after admission, preserves its zero-response guard facts before cleanup, and replays terminally with exact route/schema/queue/cockpit/isolation and no model call.

## 2026-08-25 - Installed session-observation preflight r6 unlocked one evidence capture

- **Objective:** Qualify the actual OpenCode source needed to observe an unfinalized mission root before cleanup.
- **Approach:** Run one installed OpenCode 1.18.22 two-slice zero-model preflight with a paused grind-disabled mission-root canary created only after admission; hydrate root detail/messages independently of result files; preserve guard/provider facts; delete all roots; and replay offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-preflight-r6/evaluation.json` and `evidence/task-4-2-integrated-two-slice-preflight-replay-r6/evaluation.json` are terminal `complete` with zero live calls. Raw evidence records the exact route, `modelRootCreated=false`, canary `assistantMessages=0`, `completedResponses=0`, guard `state=paused`, two deleted roots, complete cleanup, corrected outcome, exact queue/schema/cockpit/isolation, and no observation error.
- **Outcome:** The missing-observation source is qualified. Exactly one configured r5 invocation is unlocked as bounded evidence capture, not proof, to preserve the apply root's current guard revision/certificate/messages if terminal result creation again misses the unchanged wall-clock envelope.
- **Reason:** r4's full reachable evaluator chain is replayed and the only missing discriminating raw fact now has a proven positive observation/control path that runs before session deletion.
- **Do-Not-Repeat Condition:** Do not rerun selftest r8, preflight r6, their replays, or represent the canary as configured/product proof. Do not increase any timeout or launch more than one configured capture from this unlock.
- **Evidence-Based Retry Condition:** Run configured evidence capture r5 once with all existing route/version/profile/timeout/effect constraints, preserve and replay it, then classify only the observed guard/provider timeline. A green complete two-root evaluator may close task 4.2; otherwise another live attempt remains blocked pending a causally distinct correction.

## 2026-08-25 - Configured r5 narrowed the unresolved terminal-certificate boundary

- **Objective:** Acquire the missing apply-guard and configured-provider timeline after the result-independent mission-session observation source was qualified.
- **Approach:** Ran one isolated OpenCode `1.18.22` configured evidence capture with `openai/gpt-5.6-sol`, profile `quality-independent`, variant `xhigh`, the corrected four-artifact outcome, unchanged command/controller/observer bounds, disposable local commits, and no host `:4096` attachment; replayed the immutable bundle offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r5/{raw,evaluation}.json` and `evidence/task-4-2-integrated-two-slice-capture-replay-r5/evaluation.json` are terminal `blocked`. The bundle records 49 completed exact-route assistant responses, zero response errors, `opsx-propose` and `opsx-apply` command results both `completed`, eligible apply verification with requirement `1`, `remaining=0`, `state=all_done`, and strict validation status `0`. `src/beta.txt` contains `beta\n`, but no executor `result.json` exists and durable state remains `session-launch` / `running` for `slice-b`. The last projected guard state is `settling-idle`; its terminal-certificate challenge is `waiting`, targets requirement `1` at revision `fb0816cbe64ca561e2825d29e628ddd6cafafe360a6b40b7219f5202fd40f4cb`, and the prior accepted revision is `a013a291156fb02fcee1f3e631e6eae4e40542e4a743f29d036981d69f8fd7dc`. Cleanup deleted both proof roots and completed. The raw projection does not include `roadmapMission.certificateStatus`, `certificateReason`, or the issued certificate, so it cannot distinguish an issuer-side non-persist from a guard-side non-consume. `noRemote=false` is caused by the absent failure-path `repository` projection, not by evidence of a configured remote.
- **Outcome:** Task 4.2 remains open and the configured/live gate is blocked. The first supported failing boundary is after deterministic apply verification and before terminal-certificate acceptance, executor-result persistence, archive, checkpoint, or successor activation.
- **Reason:** The missing mission certificate metadata prevents a narrower causal classification. Increasing the fixed command, controller, or observer bounds would not close that evidence gap and remains out of scope.
- **Do-Not-Repeat Condition:** Do not rerun captures `r1`-`r5`, increase timeouts, infer that the certificate was issued or rejected, treat `noRemote=false` as a remote effect, compose the partial first root, or launch another configured/live attempt while the gate is blocked.
- **Evidence-Based Retry Condition:** Extend the existing result-independent observer to preserve bounded mission certificate status/reason/certificate presence and a direct local Git-remote fact on early exit; prove that observation with a fresh selftest plus installed zero-model two-slice preflight and offline replays. Only then may one bounded configured attempt be reconsidered, still as evidence capture rather than task proof until the complete two-root evaluator is green.

## 2026-08-25 - Certificate-metadata observation gates reopened one configured capture

- **Objective:** Qualify the missing certificate-metadata and early-exit repository observations before another configured task-4.2 invocation.
- **Approach:** Extend the existing result-independent session projection with bounded `roadmapMission` certificate status, reason, and terminal-certificate presence; retain a direct local Git-remote fact when capture exits before full repository evaluation; require the existing paused canary to prove those fields; then run a create-new provider-free selftest/replay and installed OpenCode `1.18.22` zero-model preflight/replay.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-selftest-r9/evaluation.json` and `evidence/task-4-2-integrated-two-slice-selftest-replay-r9/evaluation.json` are terminal `complete` with zero live calls; the full 18-check synthetic two-slice evaluator remains green and `missionSessionObservation=true`. `evidence/task-4-2-integrated-two-slice-preflight-r7/evaluation.json` and `evidence/task-4-2-integrated-two-slice-preflight-replay-r7/evaluation.json` are terminal `complete` with zero live calls. The installed canary has zero assistant/completed responses, `modelRootCreated=false`, guard `paused`, `certificateStatus=declined`, `certificateReason=preflight-canary`, `terminalCertificate=null`, two deleted roots, and complete cleanup; route, schema, queue, proposal outcome, cockpit, and isolation checks remain green.
- **Outcome:** Exactly one configured `r6` invocation is unlocked as bounded evidence capture. It remains non-proof unless the complete two-root evaluator is green.
- **Reason:** The result-independent observer can now distinguish issuer metadata state from guard challenge state and can report local remote configuration even when no executor result is written. This closes r5's evidence gap without changing product, command, controller, observer, or cleanup timeouts.
- **Do-Not-Repeat Condition:** Do not rerun selftest `r9`, preflight `r7`, their replays, or any configured capture `r1`-`r5`; do not launch more than one configured invocation from this unlock or infer product success from the positive-control canary.
- **Evidence-Based Retry Condition:** Run configured capture `r6` once under the unchanged route/version/profile/effect/timeout envelope, preserve and replay the immutable bundle, and classify the certificate status/reason/challenge timeline. A complete two-root evaluator may close task 4.2; any other result blocks another live attempt until a causally distinct correction is proved provider-free and at the installed zero-model boundary.

## 2026-08-25 - Configured r6 proved a stale guard-metadata overwrite

- **Objective:** Use the qualified certificate projection to distinguish issuer non-persist from guard non-consume at the first configured proposal phase.
- **Approach:** Ran the single unlocked OpenCode `1.18.22` configured capture `r6` with the unchanged exact route/profile/variant, project-local four-artifact schema, command/controller/observer bounds, disposable local-commit envelope, and complete cleanup; replayed the immutable bundle offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r6/{raw,evaluation}.json` and `evidence/task-4-2-integrated-two-slice-capture-replay-r6/evaluation.json` are terminal `blocked`; capture records 32 completed exact-route responses. `opsx-propose` completed, all four artifacts verified complete, and strict validation passed. The structured executor result contains the exact `allow_stop` terminal certificate for `artifact:design`, `artifact:proposal`, `artifact:specs`, and `artifact:tasks`, but ends `transient` with `completion guard did not reach a terminal state; last=running certificate=expired:issuer-timeout`. The same root's final projected mission metadata is `certificateStatus=pending`, `certificateReason=null`, and `terminalCertificate=null`; guard state is paused with expired `issuer-timeout`. Durable controller state is terminal `paused` at cursor 0, no apply/archive/successor ran, `remotes=""`, four roots were deleted, the controller PTY exited, and cleanup completed.
- **Outcome:** Task 4.2 remains open and live/configured attempts are blocked. A production concurrency defect is now named: guard status persistence can overwrite a terminal certificate written by the executor with stale cached session metadata.
- **Reason:** `GuardStatusReporter.persistConverged` merges `completionGuard` into cached `state.root.metadata` and writes the complete metadata object, while the executor writes `roadmapMission` independently. The r6 result proves certificate construction/issuer return, while final readback proves the mission field regressed to its earlier pending/null value.
- **Do-Not-Repeat Condition:** Do not rerun r6, change timeouts, retry the configured lane before a changed candidate is proved locally, or treat the transient result as a provider failure.
- **Evidence-Based Retry Condition:** Refresh authoritative session metadata immediately before each guard status merge, preserve externally written mission metadata, add a focused stale-cache certificate regression, and regain provider-free terminal-certificate runtime proof plus a fresh installed zero-model integrated preflight/replay. Only that changed candidate may reconsider one bounded configured capture.

## 2026-08-25 - Stale-metadata correction reopened one changed-candidate capture

- **Objective:** Correct r6's certificate overwrite and regain focused, provider-free real-runtime, and installed zero-model evidence before another configured invocation.
- **Approach:** Extend `GuardStatusReporter.persistConverged` to read current session metadata before each convergence write and merge only the current guard projection into that authoritative metadata; add a stale-cache regression where an externally issued certificate must survive guard persistence; run the focused suite, the installed same-runtime local-provider certificate path, and the integrated preflight/replay.
- **Evidence:** `npm run test:focused:session-completion-guard` is green at 43/43. `evidence/task-4-2-guard-metadata-continue-r1/evaluation.json` and `evidence/task-4-2-guard-metadata-continue-replay-r1/evaluation.json` are terminal `complete`: one local primary response, zero arbiter calls, issued requirement-`1` certificate, guard `passed`, executor `completed`, no nested server, root deletion, and complete cleanup. The earlier `evidence/task-4-2-guard-metadata-capture-r1` proposal fixture correctly declined before certificate issuance because that maintained scenario creates no proposal artifacts; it is a route mismatch, not candidate failure. `evidence/task-4-2-integrated-two-slice-preflight-r8/evaluation.json` and replay are terminal `complete` with zero live calls and green route/schema/queue/certificate-observation/cockpit/isolation/cleanup checks on the changed guard source.
- **Outcome:** Exactly one configured `r7` invocation is unlocked as changed-candidate evidence capture. Task 4.2 remains open unless its complete two-root evaluator is green.
- **Reason:** The correction changes the exact r6 lost-update mechanism without adding an owner, abstraction, timeout, or fallback path. The focused regression proves stale-cache preservation; the local installed runtime proves a real certificate reaches `passed`; the integrated preflight proves the changed loaded source and zero-model campaign boundary.
- **Do-Not-Repeat Condition:** Do not rerun the inapplicable local proposal fixture, focused suite, local continue capture, preflight r8, their replays, or configured captures r1-r6; do not launch more than one configured invocation from this unlock.
- **Evidence-Based Retry Condition:** Run configured capture `r7` once under the unchanged exact route/version/profile/effect/timeout envelope, preserve/replay it, and classify the complete campaign evaluator. Any non-complete result blocks another live attempt until its first changed-candidate boundary is causally corrected and re-proved locally.

## 2026-08-25 - Configured r7 preserved issuance and exposed a lost idle recheck

- **Objective:** Prove the two-phase proposal slice after correcting stale guard metadata, then continue automatically to the queued apply slice.
- **Approach:** Ran the single unlocked configured `r7` capture and immutable replay with unchanged OpenCode `1.18.22`, exact route/profile/variant, four-artifact schema, command/controller/observer limits, local-commit envelope, isolation, and cleanup.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r7/{raw,evaluation}.json` and replay are terminal `blocked` with 34 completed exact-route responses and no response errors. Proposal command/certificate passed. Apply command and deterministic verification completed with requirement `1`, zero remaining tasks, strict validation zero, and exact `beta\n`. Final mission metadata correctly retains `certificateStatus=issued` and the apply `allow_stop` certificate. Its challenge ref, revision digest, issuer, root ref, and requirement ids exactly match the guard's `waiting` challenge. Guard status stopped updating at `settling-idle`; the executor reached its unchanged 300-second wait bound, wrote terminal error `last=settling-idle certificate=waiting:none`, and controller stopped blocked before archive. The result incorrectly retained `guardState=passed` from the prior proposal phase. The controller PTY exited, local Git has no remote, both created roots were deleted, and fixture cleanup completed.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. The stale-metadata fix is retained; r7's first new boundary is a lost completion-guard idle recheck after a valid issued certificate.
- **Reason:** `handleSettledIdle` returns immediately when compaction, a guard turn, or an active audit becomes transiently present after the timer was scheduled, but it neither reschedules nor changes the persisted `settling-idle` state. With a waiting terminal certificate and no later event, that drops the only acceptance recheck. Separately, the executor does not reset `guardState` between proposal and apply phases, so a thrown second-phase wait retains the first phase's `passed` value.
- **Do-Not-Repeat Condition:** Do not rerun r7, alter limits, rework the already-correct certificate metadata merge, treat the exact matching certificate as invalid, or launch another configured attempt before the lost-wakeup path and stale per-phase diagnostic are corrected and re-proved locally.
- **Evidence-Based Retry Condition:** When a waiting terminal certificate encounters a transient idle blocker, schedule one bounded settle recheck instead of dropping wakeup; add a focused race oracle; reset executor `guardState` before each phase. Regain the focused guard suite, provider-free installed terminal-certificate runtime proof, and fresh installed zero-model integrated preflight/replay before reconsidering one configured capture.

## 2026-08-25 - Lost idle recheck corrected and r8 locally unlocked

- **Objective:** Close r7's first unsupported certificate-consumption boundary without widening the mission or timeout envelope.
- **Approach:** Extended the existing completion controller so a waiting terminal certificate reschedules the settle check when compaction, a guard turn, or an active audit transiently blocks the scheduled callback. Kept ordinary non-certificate scheduling unchanged. Reset executor `guardState` at each command boundary so second-phase failure cannot inherit proposal-phase `passed`. Added one focused race oracle to the existing guard suite.
- **Evidence:** `npm run test:focused:session-completion-guard` is green at 44/44, including the new deterministic transient-guard-turn recheck oracle and the prior stale-metadata regression. `evidence/task-4-2-terminal-recheck-continue-r1/evaluation.json` and immutable replay are terminal `complete`: installed same-runtime `opsx-apply`, one local primary response, zero arbiter responses, issued requirement-`1` certificate, guard `passed`, executor `completed`, root deletion, no nested server, and complete cleanup. `evidence/task-4-2-integrated-two-slice-preflight-r9/evaluation.json` and replay are terminal `complete` with `liveCalls=0` and green command, route, schema, proposal-outcome, queued-active, mission-session observation, isolation, PTY-finalization, and cleanup checks.
- **Outcome:** The r7 lost-wakeup mechanism and stale per-phase diagnostic are locally closed. One changed-candidate configured r8 capture is unlocked; task 4.2 remains open until the complete two-root evaluator is green.
- **Reason:** The fix retains the current controller owner and timer, adds no timeout/fallback/abstraction, and rechecks only a certificate already waiting at the terminal boundary. The local installed path proves issuance through consumption; preflight proves the changed loaded source without a model call.
- **Do-Not-Repeat Condition:** Do not rerun r7 or any local/preflight bundle above, increase limits, launch more than one configured attempt, or treat the unlocked attempt as complete before immutable replay and the full evaluator.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r8 capture under the unchanged OpenCode/model/profile/variant/schema/effect/timeout envelope, replay it immutably, and classify the complete campaign evaluator. Any non-complete result blocks another configured/live invocation until its first new boundary is causally corrected and re-proved locally.

## 2026-08-25 - Configured r8 showed recheck without terminal-gate progress

- **Objective:** Prove that retaining the settle recheck lets the matching apply certificate reach guard `passed` and unlock the successor slice.
- **Approach:** Ran the single unlocked configured r8 capture and immutable replay under the unchanged exact route, version, profile, variant, schema, local-effect, isolation, readiness, command, controller, observer, and cleanup envelope.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r8/{raw,evaluation}.json` and replay are terminal `blocked` with 45 completed exact-route responses, zero response errors, local Git with no remote, and complete fixture cleanup. Proposal reached guard `passed`; apply completed with all implementation tasks checked, strict validation zero, exact `beta\n`, and an Implementation Complete response. Mission metadata retains an issued requirement-`1` `allow_stop` certificate. Its challenge ref, revision digest, root ref, issuer, and requirement ids exactly match the guard's waiting challenge, but guard metadata remains `settling-idle` / `waiting` with no later persisted transition. The campaign remains durable `session-launch` / `running` on slice-b and did not archive or activate slice-a. The outer 600-second durable observer ended before the executor's own 300-second terminal wait because the 45-response proposal/apply work consumed the earlier portion of the campaign; therefore the missing executor result is bounded partial-capture timing, not evidence for a new timeout increase.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. Retaining a timer recheck alone does not make progress when a transient guard gate remains asserted or recurs after a valid issued certificate.
- **Reason:** `handleSettledIdle` checks compaction, guard-turn, and active-audit gates before refreshing and evaluating mission certificate metadata. The r7 correction reschedules while waiting but still returns at that gate indefinitely. Once mission metadata contains a complete issued certificate, those transient flags should not suppress certificate evaluation: the existing evaluator remains fail-closed on challenge, root, revision, lease, requirements, claims, and pending questions, and `session.updated` already invalidates any audit when the certificate arrives.
- **Do-Not-Repeat Condition:** Do not rerun r8, increase the outer or executor limits, infer a new executor defect from the absent partial result, or add another timer/retry. Do not bypass certificate validation or permit unissued waiting challenges to cross the transient gate.
- **Evidence-Based Retry Condition:** Permit only a waiting challenge whose root metadata already contains `certificateStatus=issued` and a terminal certificate to cross the transient idle gate into the existing full validator. Extend the focused race oracle through the validator call, then regain the focused suite, provider-free installed certified continue path, and fresh installed zero-model integrated preflight/replay before reconsidering one configured capture.

## 2026-08-25 - Issued certificate now reaches validation across transient gates

- **Objective:** Close r8's persistent terminal gate while retaining all certificate, revision, question, async-work, and session-status safeguards.
- **Approach:** Narrowed `handleSettledIdle` so only a waiting challenge whose current root metadata already contains `certificateStatus=issued` and a terminal certificate may continue past transient compaction, guard-turn, or active-audit flags. The normal session-idle, child/lease preflight, inspection, generation check, and full terminal-certificate evaluator remain unchanged. Unissued challenges still use the bounded settle recheck. Extended the focused oracle through idle/child preflight and the existing validator entry.
- **Evidence:** `npm run test:focused:session-completion-guard` is green at 44/44. The terminal-certificate oracle proves an unissued waiting challenge retains a settle callback and an issued challenge reaches the validator despite a retained guard-turn flag. `evidence/task-4-2-terminal-gate-continue-r1/evaluation.json` and replay are terminal `complete` with installed same-runtime certified apply, guard `passed`, executor `completed`, zero arbiter calls, root deletion, no nested server, and cleanup complete. `evidence/task-4-2-integrated-two-slice-preflight-r10/evaluation.json` and replay are terminal `complete` with `liveCalls=0` and all command, route, schema, proposal, queued-active, observation, isolation, PTY, and cleanup checks green.
- **Outcome:** The exact r8 terminal-gate boundary is locally closed. One changed-candidate configured r9 capture is unlocked; task 4.2 remains open until the complete two-root evaluator is green.
- **Reason:** This is causally distinct from another retry: an already-issued certificate is treated as a terminal signal that must be evaluated rather than suppressed by stale/transient turn flags. It does not accept the certificate directly; all existing fail-closed correlation and preflight checks remain authoritative.
- **Do-Not-Repeat Condition:** Do not rerun r8 or the local/preflight bundles above, add retries, relax validation, alter limits, or launch more than one configured attempt.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r9 capture under the unchanged route/version/profile/variant/schema/effect/timeout envelope, replay it immutably, and classify the full campaign evaluator. Any non-complete result blocks another configured/live invocation until its first new boundary is causally corrected and re-proved locally.

## 2026-08-25 - Configured r9 ruled out the top transient gate as sole cause

- **Objective:** Prove that an already-issued apply certificate reaches the unchanged full validator across transient completion-guard flags and unlocks the queued successor.
- **Approach:** Ran the single unlocked configured r9 capture and immutable replay under the unchanged exact route/version/profile/variant/schema/effect/timeout/isolation/cleanup envelope.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r9/{raw,evaluation}.json` and replay are terminal `blocked` with 35 completed exact-route responses, zero response errors, no Git remote, and complete fixture cleanup. Proposal reached guard `passed`; apply completed all tasks and deterministic validation, and mission metadata retains an issued requirement-`1` certificate exactly matching the guard's waiting challenge. Guard metadata still remains `settling-idle` / `waiting`, with no later persisted transition; durable mission state remains slice-b `session-launch` / `running`, so archive and slice-a activation did not occur. The waiting challenge was persisted about 307 seconds after slice launch, leaving about 293 seconds before the outer 600-second observer bound, just short of the executor's unchanged 300-second terminal wait; the absent result is therefore expected bounded partial-capture timing.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. Allowing issued evidence across the top compaction/guard-turn/active-audit condition did not produce a later guard transition, so that condition was not the sole failure mechanism.
- **Reason:** The current preserved projection ends at the waiting challenge and does not identify which later pre-validator boundary returned: session status not idle, child/lease preflight generation drift, post-inspection generation drift, timer delivery, or another condition before `tryTerminalCertificate`. Another production edit that guesses among those boundaries would repeat the failed mechanism class.
- **Do-Not-Repeat Condition:** Do not rerun r9, increase observer/executor limits, add another retry or bypass, infer the exact pre-validator exit from absent metadata, or launch another configured/live attempt.
- **Evidence-Based Retry Condition:** First identify the exact r9 post-challenge exit from preserved source/evidence or a provider-free deterministic reproducer/instrumented local boundary. Only a named causally distinct correction with focused proof, installed certified continue proof, and fresh zero-model preflight/replay can reopen one bounded configured attempt.

## 2026-08-25 - Busy-status issued-certificate rearm reproduced and corrected

- **Objective:** Replace branch inference after r9 with one deterministic provider-free reproducer and correct only its named no-progress boundary.
- **Approach:** A bounded read-only troubleshooter pass narrowed the unobserved branch set and selected the strongest reachable branch: after an issued certificate crosses the top transient gate, a non-idle root status returns through ordinary `scheduleIdle`, whose retained guard-turn flag rejects the rearm. Extended the existing focused terminal-certificate oracle with busy-then-idle status and observed it fail with no timer. Changed only that return so an already-issued waiting certificate uses the existing issued-certificate rearm allowance; the next pass still requires root idle, clear child/lease preflight, stable generation/inspection, and full certificate validation.
- **Evidence:** Before production correction, `bun tools/test-session-completion-guard.ts --oracle-terminal-certificate-recheck` failed exactly: `An issued certificate must retain a settle recheck after a transient busy status.` After correction the oracle passed, and `npm run test:focused:session-completion-guard` is green at 44/44. `evidence/task-4-2-terminal-status-rearm-continue-r1/evaluation.json` and replay are terminal `complete` with installed certified apply, guard `passed`, executor `completed`, zero arbiter calls, no nested server, root deletion, and cleanup complete. `evidence/task-4-2-integrated-two-slice-preflight-r11/evaluation.json` and replay are terminal `complete` with `liveCalls=0` and all integrated route/schema/queue/observation/isolation/PTY/cleanup checks green.
- **Outcome:** A causally distinct reachable post-issuance lost-rearm defect is locally closed. One changed-candidate configured r10 capture is unlocked; task 4.2 remains open until the complete two-root evaluator is green.
- **Reason:** This correction guarantees a future idle observation without bypassing any safety predicate. It is not another timeout, generic retry, certificate acceptance shortcut, or claim about which unrecorded r9 branch historically fired.
- **Do-Not-Repeat Condition:** Do not rerun r9, the failing oracle state, or the green local/preflight bundles; do not infer that generation branches are historical defects, alter limits, or launch more than one configured attempt.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r10 capture under the unchanged route/version/profile/variant/schema/effect/timeout envelope, replay it immutably, and classify the full evaluator. Any non-complete result blocks another configured/live invocation until its first new boundary is named from preserved evidence or a causally distinct provider-free reproducer.

## 2026-08-25 - Configured r10 ruled out busy-status rearm as sole cause

- **Objective:** Prove the issued certificate after guaranteeing rearm across a transient non-idle root status.
- **Approach:** Ran the single unlocked configured r10 capture and immutable replay under the unchanged exact route/version/profile/variant/schema/effect/timeout/isolation/cleanup envelope.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r10/{raw,evaluation}.json` and replay are terminal `blocked` with 33 completed exact-route responses, zero response errors, no Git remote, and complete fixture cleanup. Unlike r8/r9 partial timing, the executor completed its full terminal wait and wrote `result.json`: both proposal and apply phases are completed, terminal certificate is the exact matching requirement-`1` `allow_stop`, `guardState=unknown` correctly reflects the reset second-phase diagnostic, and the failure is `last=settling-idle certificate=waiting:none`. Durable state terminal-stopped blocked on slice-b; archive and successor activation did not occur. Final guard metadata remains the same waiting challenge with no later persisted transition.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. The deterministic busy-status lost-rearm defect is valid and retained, but r10 proves it was not the sole historical cause of the configured stall.
- **Reason:** The remaining silent pre-validator returns are now narrower: preflight lease-generation mismatch, post-inspection generation mismatch, stale cached issuance before authoritative refresh, or timer/callback non-delivery. No current persisted field distinguishes them.
- **Do-Not-Repeat Condition:** Do not rerun r10, remove the valid busy-status regression/fix, increase limits, add a generic retry/bypass, or launch another configured attempt.
- **Evidence-Based Retry Condition:** Extend the same provider-free focused oracle into a deterministic branch matrix for preflight-generation and post-inspection-generation drift, with a stable acceptance control and no model call. Observe the first zero-rearm failure before any production correction; another live attempt stays blocked.

## 2026-08-25 - Remaining issued-certificate branch matrix closed locally

- **Objective:** Exhaust the provider-free post-challenge branch set left by r10 before another configured attempt.
- **Approach:** Extended the existing terminal-certificate oracle across actual timer delivery, transient busy-to-idle status, stale cached pending versus authoritative issued metadata, preflight generation drift, post-inspection generation drift, and stable validator entry. Observed each new no-progress branch before correcting it: preflight drift returned stale with no timer; after its rearm correction, inspection drift returned with no timer; after that correction, stale cached mission metadata rechecked without authoritative issuance. Production now refreshes authoritative root metadata when a waiting certificate meets a transient gate and retains the issued-certificate settle allowance across busy-status and both generation-drift returns. Each drift still blocks validation on that pass; acceptance still requires the later stable session/child/lease/inspection/generation/full-validator path.
- **Evidence:** The focused oracle failed in sequence with `An issued certificate must retain a settle recheck after preflight generation drift`, then `...after inspection generation drift`, then `A waiting certificate must refresh authoritative issued metadata before transient gating`; each failure was observed before its scoped correction. The final direct oracle passes through the actual timer, and `npm run test:focused:session-completion-guard` is green at 44/44. `evidence/task-4-2-terminal-branch-matrix-continue-r1/evaluation.json` and replay are terminal `complete` with installed certified apply, guard `passed`, executor `completed`, zero arbiter calls, no nested server, root deletion, and cleanup complete. `evidence/task-4-2-integrated-two-slice-preflight-r12/evaluation.json` and replay are terminal `complete` with `liveCalls=0` and all integrated checks green.
- **Outcome:** Every source-visible silent pre-validator branch named after r10 now has a deterministic provider-free oracle and bounded progress behavior. One changed-candidate configured r11 capture is unlocked; task 4.2 remains open until the full two-root evaluator is green.
- **Reason:** The corrections guarantee another settle observation after a transient safety check; they never accept a stale generation, busy root, unresolved child/lease, pending question, mismatched revision, malformed certificate, or unsupported issuer.
- **Do-Not-Repeat Condition:** Do not rerun r10, the staged failing oracle states, or the green local/preflight bundles; do not add retries or timeout, weaken validation, or launch more than one configured attempt.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r11 capture under the unchanged route/version/profile/variant/schema/effect/timeout envelope, replay it immutably, and classify the full evaluator. Any non-complete result blocks another configured/live invocation and must be diagnosed from its first changed boundary without repeating this branch set.

## 2026-08-25 - Configured r11 requires owning-boundary stage diagnostics

- **Objective:** Prove the exact certificate after closing every source-visible silent pre-validator branch in the provider-free matrix.
- **Approach:** Ran the single unlocked configured r11 capture and immutable replay under the unchanged exact route/version/profile/variant/schema/effect/timeout/isolation/cleanup envelope.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r11/{raw,evaluation}.json` and replay are terminal `blocked` with 35 completed exact-route responses, zero response errors, no Git remote, and complete fixture cleanup. The executor completed its full fixed terminal wait and wrote a terminal result: both command phases completed, `guardState=unknown`, and the exact matching issued requirement-`1` certificate remained `waiting` with `last=settling-idle certificate=waiting:none`. Durable state terminal-stopped blocked on slice-b; final guard metadata has no later persisted transition; archive and successor activation did not occur.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. r11 did not move the first persisted boundary after the complete local branch matrix, so another behavior correction inferred from the same snapshot is not justified.
- **Reason:** The remaining distinction is runtime-only: whether the scheduled callback fired and, if it did, which status/preflight/inspection/validator stage it reached. Current durable metadata intentionally does not record those transient facts.
- **Do-Not-Repeat Condition:** Do not rerun r11, repeat any branch-matrix correction, increase limits, infer a timer or status fact from absence, or launch another configured attempt without stage evidence.
- **Evidence-Based Retry Condition:** Add bounded privacy-safe once-per-challenge stage diagnostics at the existing completion-controller logger for schedule, timer fire, status, preflight generation, inspection generation, and validator result. Focused-check the instrumentation and run a fresh installed zero-model integrated preflight/replay before one diagnostic configured capture can be reconsidered.

## 2026-08-25 - Bounded terminal stage diagnostics unlock diagnostic r12

- **Objective:** Make the next configured observation distinguish callback delivery and the exact pre-validator/validator stage without changing mission behavior.
- **Approach:** Added in-memory once-per-challenge terminal stage keys to the existing root state and existing controller logger. At most 64 keys per root record only bounded stage enums, booleans, generation integers, and hashed root/challenge refs for settle scheduled/fired/entered, transient refresh, root status, preflight, inspection, and validator result. No prompt, payload, path content, credential, acceptance rule, timeout, scheduling rule, or durable guard schema changed.
- **Evidence:** `npm run test:focused:session-completion-guard` remains green at 44/44; the terminal branch-matrix oracle now asserts actual timer delivery and validator-result stage capture. `evidence/task-4-2-integrated-two-slice-preflight-r13/evaluation.json` and immutable replay are terminal `complete` with `liveCalls=0` and all command, route, schema, proposal, queue, observation, isolation, PTY, and cleanup checks green on the instrumented source.
- **Outcome:** One configured diagnostic r12 capture is unlocked under the unchanged model/effect/timeout envelope. Task 4.2 remains open; the attempt is proof only if the full evaluator is green.
- **Reason:** This is the smallest owning-boundary instrumentation that can falsify timer/status/generation/validator hypotheses from one captured server log without persisting transient policy state or perturbing certificate acceptance.
- **Do-Not-Repeat Condition:** Do not rerun r11 or preflight r13, expand logging, include raw identifiers/content, alter limits, or launch more than one configured diagnostic attempt.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r12 capture, replay it immutably, and extract the bounded `terminal certificate settle stage` sequence. A non-complete result blocks another live invocation; use the last observed stage as the sole next diagnosis boundary.

## 2026-08-25 - Diagnostic r12 showed app.log is outside captured streams

- **Objective:** Capture the bounded controller stage sequence and identify the exact configured terminal-certificate stop.
- **Approach:** Ran the single unlocked configured diagnostic r12 capture and immutable replay under the unchanged route/version/profile/variant/schema/effect/timeout/isolation/cleanup envelope.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r12/{raw,evaluation}.json` and replay are terminal `blocked` with 34 completed exact-route responses, zero response errors, no Git remote, and complete fixture cleanup. Proposal/apply again completed with an exact matching issued certificate while guard metadata remained `settling-idle` / `waiting`; the outer observer reached its fixed bound before an executor result. `serverDiagnostics` contains no `terminal certificate settle stage` record even though focused proof confirms the controller recorded stages in memory. The proof server already uses `--print-logs --log-level INFO`, establishing that plugin `app.log` records are not mirrored into the runner's captured stdout/stderr channel.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. r12 did not observe a controller stage; it identified a Proof Runner diagnostic-channel gap rather than a new Product Candidate boundary.
- **Reason:** The stage data was emitted only through an OpenCode logging endpoint not owned by the current evidence finalizer. Persisting transient diagnostics into session metadata would perturb the guarded race.
- **Do-Not-Repeat Condition:** Do not rerun r12, infer callback absence from the missing log, persist stage transitions into guard metadata, expand diagnostics, or launch another configured attempt before proving a captured channel.
- **Evidence-Based Retry Condition:** Under a proof-runner-only environment flag, mirror the same bounded redacted stage record to process stderr, which the existing runner already captures and redacts; keep normal runtime silent. Regain focused guard proof and a fresh installed zero-model integrated preflight/replay before one diagnostic r13 capture can be reconsidered.

## 2026-08-25 - Captured stage channel qualifies diagnostic r13

- **Objective:** Prove that bounded terminal stages reach an evidence channel already preserved by the integrated runner while normal runtime remains silent.
- **Approach:** The integrated proof server alone sets `OPENCODE_PROOF_TERMINAL_STAGE_STDERR=1`. Under that flag the controller mirrors the same bounded redacted stage object to stderr with a stable prefix; without it, only the existing `app.log` call remains. The focused wrapper enables the flag for its Bun oracle and checks the captured prefix.
- **Evidence:** `npm run test:focused:session-completion-guard` is green at 44/44 and now asserts both in-memory stage progression and captured `[session-completion-guard:terminal-stage]` output from the child process. Controller diagnostics are clean. `evidence/task-4-2-integrated-two-slice-preflight-r14/evaluation.json` and replay are terminal `complete` with `liveCalls=0` and all integrated checks green on the exact proof-only sink.
- **Outcome:** One configured diagnostic r13 capture is unlocked. Task 4.2 remains open; completion still requires the full evaluator, while a blocked result must provide the last captured stage.
- **Reason:** The sink uses the runner's existing redacted process stream, adds no persistent product state, and is inert outside the explicit proof environment.
- **Do-Not-Repeat Condition:** Do not rerun r12/r14, enable the sink in normal runtime, include unredacted content, alter limits, or launch more than one configured diagnostic attempt.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r13 capture, replay it immutably, and extract the ordered bounded stage records from `serverDiagnostics`. Any non-complete result blocks another live invocation; the last stage is the sole next diagnosis boundary.

## 2026-08-25 - Diagnostic r13 exposed finalizer stage-line filtering

- **Objective:** Preserve the opt-in stderr terminal-stage sequence in the configured evidence bundle.
- **Approach:** Ran the single unlocked configured diagnostic r13 capture and immutable replay under the unchanged exact route/version/profile/variant/schema/effect/timeout/isolation/cleanup envelope.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r13/{raw,evaluation}.json` and replay are terminal `blocked` with 41 completed exact-route responses, zero response errors, no Git remote, and complete fixture cleanup. Proposal/apply again completed with an exact matching issued certificate while guard remained `settling-idle` / `waiting`; the outer observer reached its fixed bound before executor result. No prefixed stage appears in `raw.serverDiagnostics`. Source inspection identifies the deterministic cause in the existing finalizer: it retains only error/warn lines or boundary lines matching `mission|pty`; the exact `[session-completion-guard:terminal-stage]` line matches neither and is discarded before writing `raw.json`.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. r13 identified a Proof Runner finalizer-filter gap, not a new Product Candidate boundary or proof of callback absence.
- **Reason:** The stderr sink is focused-proved, but its line was outside the finalizer's allowlist. Extending that allowlist for the exact bounded prefix preserves existing privacy and output limits.
- **Do-Not-Repeat Condition:** Do not rerun r13, infer missing runtime stages, preserve unfiltered server output, broaden the line filter generically, alter limits, or launch another configured attempt before finalizer proof.
- **Evidence-Based Retry Condition:** Extend only the existing boundary-line predicate to retain `[session-completion-guard:terminal-stage]`, then run focused/static checks and a fresh installed zero-model integrated preflight/replay before one diagnostic r14 capture can be reconsidered.

## 2026-08-25 - Exact stage-prefix finalizer qualifies diagnostic r14

- **Objective:** Preserve only the bounded terminal-stage lines in the integrated raw bundle.
- **Approach:** Extended the existing `boundaryLines` predicate with an exact `[session-completion-guard:terminal-stage]` match. Error/warn and mission/PTY rules remain unchanged; the runner still deduplicates, caps, truncates, and redacts its selected diagnostic text.
- **Evidence:** `npm run test:focused:session-completion-guard` is green at 44/44; path-scoped `git diff --check` reports only repository line-ending warnings. `evidence/task-4-2-integrated-two-slice-preflight-r15/evaluation.json` and replay are terminal `complete` with `liveCalls=0` and all integrated checks green on the exact finalizer.
- **Outcome:** One configured diagnostic r14 capture is unlocked. Task 4.2 remains open; a blocked result must now carry the ordered bounded stage sequence.
- **Reason:** The filter change preserves no unselected server output and exactly connects the already-proved sink to the existing evidence owner.
- **Do-Not-Repeat Condition:** Do not rerun r13/r15, broaden log preservation, alter diagnostics or limits, or launch more than one configured diagnostic attempt.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r14 capture, replay it immutably, and extract the ordered stage records. Any non-complete result blocks another live invocation; the last captured stage is the sole next diagnosis boundary.

## 2026-08-25 - Diagnostic r14 localizes apply stall inside certificate validation

- **Objective:** Capture the configured terminal-stage sequence and name the exact last reached controller boundary.
- **Approach:** Ran the single unlocked configured diagnostic r14 capture and immutable replay under the unchanged exact route/version/profile/variant/schema/effect/timeout/isolation/cleanup envelope, then extracted only exact-prefix bounded objects from `raw.serverDiagnostics`.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r14/{raw,evaluation}.json` and replay are terminal `blocked` with 38 completed exact-route responses, zero response errors, no Git remote, and complete fixture cleanup. The captured proposal challenge sequence is `settle-scheduled → validator-waiting → settle-fired → settle-entered → root-status-absent → preflight-clear(expected=0, observed=0) → inspection-complete(expected=0, observed=0) → validator-accepted`. The apply challenge sequence is identical only through `inspection-complete`; no validator result follows. Final mission certificate exactly matches the apply waiting challenge, while guard metadata remains `settling-idle` / `waiting` and the outer observer reaches its fixed bound before executor result.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. For the apply phase, callback delivery, root-status handling, child/lease preflight, expected/preflight generation, inspection completion, and inspection generation are ruled out. The first unsupported boundary is inside `tryTerminalCertificate` after handler inspection and before method return.
- **Reason:** The method can still block at authoritative session refresh or accepted-state persistence; synchronous binding/evaluation lies between. Existing diagnostics do not distinguish those internal stages. Proposal success proves the path is generally functional but does not qualify the second-phase concurrency.
- **Do-Not-Repeat Condition:** Do not rerun r14, revisit earlier timer/status/generation branches, infer whether refresh or persistence hung, change timeouts, or launch another configured attempt without internal validator stages.
- **Evidence-Based Retry Condition:** Add bounded once-per-challenge internal stages for validator entry, authoritative session refresh start/complete, issued evaluation start/result, and passed-state persistence start/complete. Regain focused and fresh installed zero-model preflight/replay before one diagnostic r15 capture can be reconsidered.

## 2026-08-25 - Internal validator stages qualify diagnostic r15

- **Objective:** Distinguish authoritative refresh, binding/evaluation, and passed-state persistence inside `tryTerminalCertificate`.
- **Approach:** Reused the same bounded once-per-challenge sink for validator entered, refresh start/complete, claim-binding start/complete, issued evaluation start/result, and passed persistence start/complete. No operation, ordering, payload, timeout, or acceptance logic changed.
- **Evidence:** `npm run test:focused:session-completion-guard` is green at 44/44; controller diagnostics are clean; path-scoped diff validation reports only line-ending warnings. `evidence/task-4-2-integrated-two-slice-preflight-r16/evaluation.json` and replay are terminal `complete` with `liveCalls=0` and all integrated checks green on the internal stages.
- **Outcome:** One configured diagnostic r15 capture is unlocked. Task 4.2 remains open; a blocked result must now name the exact last internal validator stage.
- **Reason:** This is the smallest non-persistent instrumentation that separates the remaining realistic blocking operations at the owning boundary.
- **Do-Not-Repeat Condition:** Do not rerun r14/r16, alter behavior/limits, expand stage payloads, or launch more than one configured diagnostic attempt.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r15 capture, replay it immutably, and extract the ordered internal validator stages. Any non-complete result blocks another live invocation; the last captured stage is the sole next diagnosis boundary.

## 2026-08-25 - Diagnostic r15 names same-status-key persistence suppression

- **Objective:** Distinguish the exact operation after apply certificate evaluation accepts.
- **Approach:** Ran the single unlocked configured diagnostic r15 capture and immutable replay under the unchanged exact route/version/profile/variant/schema/effect/timeout/isolation/cleanup envelope, then extracted exact-prefix internal stages.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r15/{raw,evaluation}.json` and replay are terminal `blocked` with 39 completed exact-route responses, zero response errors, no Git remote, complete fixture cleanup, and a full executor terminal result. Proposal traverses internal validator refresh, binding, issued evaluation accepted, passed persistence start/complete, and validator accepted. Apply traverses refresh, binding, issued evaluation accepted, and passed persistence start, while durable guard metadata remains the waiting apply challenge and executor ends `last=settling-idle certificate=waiting:none` with `guardState=unknown`. Source correlation identifies the deterministic second-phase suppression: `GuardStatusReporter.set` assigns in-memory `state=passed`, computes the same `passed:Completion guard passed (certified)` key used by proposal, and returns before `persist` when `lastStatusKey` matches.
- **Outcome:** Task 4.2 remains open and configured/live attempts are blocked. The first exact Product Candidate defect is same-status-key deduplication suppressing changed revision/certificate metadata on the second certified phase.
- **Reason:** The current key is suitable for duplicate toast suppression but not write suppression: identical user-facing status can carry materially different last-audited revision and terminal certificate state. One-phase provider-free proofs cannot exercise that second same-key transition.
- **Do-Not-Repeat Condition:** Do not rerun r15, revisit certificate/timer/status/generation hypotheses, alter timeouts, remove status convergence, or launch another configured attempt before the same-key regression and local proof.
- **Evidence-Based Retry Condition:** Add a focused reporter regression that persists certified `passed`, then a new waiting challenge/revision, then the same certified `passed` key with accepted certificate and requires the second metadata write. Make `set` always persist current state while using the duplicate key only to suppress duplicate toast. Regain focused guard, installed certified continue, and fresh zero-model integrated preflight/replay before one configured capture can be reconsidered.

## 2026-08-25 - Same certified key now persists each revision

- **Objective:** Close r15's exact second-phase metadata suppression without creating duplicate user notifications.
- **Approach:** Added a focused reporter oracle that persists proposal certified-passed, a new apply waiting challenge, then the same certified-passed key with a new accepted certificate/revision. It failed before production correction with `updates=2`. Changed `GuardStatusReporter.set` to always serialize/persist current state; `lastStatusKey` now suppresses only the duplicate toast after persistence.
- **Evidence:** Before correction, the new oracle failed `Both certified revisions and the waiting transition must persist; updates=2.` After correction, `npm run test:focused:session-completion-guard` is green at 45/45, including three writes, one toast, durable apply revision, and accepted certificate assertions. `status.ts` and the test have clean diagnostics. `evidence/task-4-2-same-status-continue-r1/evaluation.json` and replay are terminal `complete` with installed certified apply, guard `passed`, executor `completed`, zero arbiter calls, no nested server, root deletion, and cleanup complete. `evidence/task-4-2-integrated-two-slice-preflight-r17/evaluation.json` and replay are terminal `complete` with `liveCalls=0` and all integrated checks green.
- **Outcome:** The exact r15 second-phase persistence defect is locally closed. One changed-candidate configured r16 capture is unlocked; task 4.2 remains open until the full two-root evaluator is green.
- **Reason:** Status text equality is a presentation concern, not a metadata identity. Persisting before toast dedupe preserves each revision/certificate while avoiding duplicate UI output.
- **Do-Not-Repeat Condition:** Do not rerun r15, remove convergence/serialization, duplicate toasts, alter limits, or launch more than one configured attempt.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r16 capture under the unchanged route/version/profile/variant/schema/effect/timeout envelope, replay it immutably, and classify the full evaluator. Any non-complete result blocks another configured/live invocation at its first new boundary.

## 2026-08-25 - Configured r16 reached successor activation then paused

- **Objective:** Prove the same-key persistence correction on one changed-candidate configured two-slice capture.
- **Approach:** Ran one isolated OpenCode `1.18.22` configured capture `r16` with `openai/gpt-5.6-sol`, profile `quality-independent`, variant `xhigh`, always-persist status reporting, unchanged timeouts, disposable local commits, and no host `:4096` attachment; replayed the immutable bundle offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r16/{raw,evaluation}.json` and `evidence/task-4-2-integrated-two-slice-capture-replay-r16/evaluation.json` are terminal `blocked`. The capture records 46 completed exact-route responses and zero response errors. Slice-b propose and apply both completed with `guardState=passed`, the executor result is `completed`, and `errorClass=none`. Ordered transitions include `archive-launch`, archive, local checkpoint `53916d6a3fd4f3fb416cd2162d45456e4d66e361` with subject `roadmap-mission(integrated-proof): checkpoint slice-b`, `successor-activation` to `slice-a`, then `pause`. Durable state is `paused` at cursor `1`, slice `slice-a`, sequence `8`; slice-a has `result=null` and `phases=[]`. Raw finalization reports `archives=["2026-08-25-change-b"]` but `archiveExists=false`; alpha marker is `null`, beta marker is `beta\n`. The run-command observation is `Unexpected server error` with ref `err_3c4ee11b`; observer validation reports `ETIMEDOUT` / `SIGTERM`. `noRemote=true`, cleanup is `complete`, and two root sessions were deleted.
- **Outcome:** Task 4.2 remains open. The configured/live gate is blocked. The r15 same-key persistence defect is closed; the first unsupported boundary is successor activation followed by pause without a slice-a executor result, plus contradictory archive/checkpoint/marker projections.
- **Reason:** This is downstream of and distinct from the closed propose-timeout, archive-key, omitted-design, missing-session-facts, omitted-issuer-metadata, stale-overwrite, lost-recheck, transient-gate, generation-drift, stage-channel, and same-key-write-suppression mechanisms.
- **Do-Not-Repeat Condition:** Do not rerun r16, increase timeouts, treat slice-b completion as task 4.2 completion, infer archive failure from `archiveExists` alone, reopen certificate consumption, or launch another configured/live attempt while the gate is blocked.
- **Evidence-Based Retry Condition:** Name the exact successor-pause and archive-observation mechanism from the preserved raw bundle and current source. If it identifies a fixture, finalizer, evaluator, or controller defect, prove one causally distinct correction locally and pass a fresh installed zero-model preflight/replay before considering one new bounded configured attempt.

## 2026-08-25 - r16 offline classification named stale attempt-budget carryover

- **Objective:** Classify why `successor-activation` was followed immediately by `pause` without a slice-a executor result, and separate that product boundary from final two-slice evaluator rows.
- **Approach:** Correlated the preserved r16 transitions, executor results, adapter limits, repository facts, configured evaluator, and the exact `executeOwned` loop source whose SHA-256 matches the captured candidate.
- **Evidence:** Captured controller SHA-256 `774d4742f22aa649e4553ace341adde04cf267635fbe081a52853d2ff102ce88` matches the current pre-correction source. R16 records slice-b `session-completion`, archive, checkpoint, cursor advance, `successor-activation` to slice-a, then `pause`; slice-a has no result or phases. The fixture sets `maxAttemptsPerSlice=1`. After successful successor activation, `executeOwned` broke from the inner loop with slice-b `attempts=1`, then evaluated that stale value against the per-slice limit and paused the new cursor before the outer loop could initialize slice-a attempts. `archiveExists=false` is computed as `archives.length === sliceIds.length`; `localCheckpoints`, `markerValidated`, and related false rows likewise require both final slices. They are expected incomplete-campaign evaluator results and do not contradict the directly observed change-b archive, checkpoint hash, beta marker, or active change-a. The initial slash `Unexpected server error`, terminal PTY exit 1, and post-run validation `ETIMEDOUT` are downstream observations of the paused controller/finalizer path; they are not the cause of the transition sequence.
- **Outcome:** A concrete Product Candidate defect is reproduced from immutable evidence and source. The smallest correction is authorized at the existing controller loop owner; the configured/live gate remains blocked pending provider-free and installed zero-model proof.
- **Reason:** Per-slice retry/wall-clock accounting must be initialized by the outer slice loop. Carrying the completed slice's exhausted budget across an already-recorded successor activation violates declared auto-chain behavior even though each individual slice completed within its own limit.
- **Do-Not-Repeat Condition:** Do not change evaluator final-state requirements, archive/readback semantics, attempt limits, wall-clock bounds, configured route, or proof finalizer to hide the controller pause. Do not rerun r16.
- **Evidence-Based Retry Condition:** Continue directly to the outer slice loop after successful successor activation, add an exact provider-free regression with `maxAttemptsPerSlice=1` that requires the second slice session launch, then run affected controller proof and a fresh installed zero-model integrated preflight/replay before reconsidering one bounded configured attempt.

## 2026-08-25 - Successor attempt-budget correction reopened one configured attempt

- **Objective:** Correct r16's immediate post-activation pause and regain every affected provider-free and installed zero-model gate before another configured invocation.
- **Approach:** Labeled the existing outer slice loop and continued directly to it after successful successor activation, so the next slice initializes its own attempts and wall-clock state. Added an exact provider-free controller fixture with `maxAttemptsPerSlice=1`; seeded only the fixture's first transient counter so slice-a succeeds in one actual attempt, then required slice-b to launch before the protected terminal boundary. Extended preserved-bundle replay with the same assertion.
- **Evidence:** `evidence/task-4-2-controller-successor-budget-r1/{raw,evaluation}.json` is terminal `complete`: the one-attempt scenario reaches cursor `2`, executes slice-b once, and records `session-launch` immediately after `successor-activation`; the full controller campaign, archive failure, retry, checkpoint, and no-push checks remain green. `evidence/task-4-2-controller-successor-budget-replay-r2/evaluation.json` is terminal `complete` with `liveCalls=0` and re-evaluates the exact successor row. `evidence/task-4-2-integrated-two-slice-preflight-r18/evaluation.json` and its replay are terminal `complete` with `liveCalls=0`, exact route/schema/queue/cockpit/session-observation/isolation, no model root, two deleted roots, and complete cleanup on candidate `add-autonomous-roadmap-mission-runtime-r14`. Node syntax checks, the apply operation gate, strict OpenSpec validation, and path-scoped diff checks are green; source-range diagnostics are clean apart from the proof file's pre-existing ambient Node/lib configuration findings.
- **Outcome:** The r16 Product Candidate defect is closed at the provider-free real controller boundary and the changed installed source is current. The configured live-attempt gate is clear for exactly one r17 capture; task 4.2 remains open until the complete two-root evaluator is green.
- **Reason:** The correction changes only loop control at the existing controller owner and preserves all attempt limits, per-slice wall clocks, admission, archive, checkpoint, failure, and evaluator semantics. The next attempt can now reach slice-a where r16 could not.
- **Do-Not-Repeat Condition:** Do not rerun r16, the green controller/preflight bundles, change timeouts/route/version/profile/auth, attach to host `:4096`, or launch more than one configured invocation from this unlock.
- **Evidence-Based Retry Condition:** Run exactly one isolated configured r17 capture under the unchanged envelope, preserve and inspect the complete raw bundle, close every writer/process/session/PTY/fixture, and replay it offline. Only the complete two-root evaluator may close task 4.2; any non-complete result blocks another configured/live invocation at its first new boundary.

## 2026-08-25 - Configured r17 completed the two-slice auto-chain

- **Objective:** Prove task 4.2's exact installed `change-b/propose` then queued `change-a/continue` campaign after correcting successor attempt-budget carryover.
- **Approach:** Ran one isolated OpenCode `1.18.22` configured capture against candidate `add-autonomous-roadmap-mission-runtime-r14` with exact `openai/gpt-5.6-sol` / `quality-independent` / `xhigh` routing, unchanged command/controller/observer limits, serial disposable local commits, no host `:4096`, and no remote; replayed the immutable raw bundle offline.
- **Evidence:** `evidence/task-4-2-integrated-two-slice-capture-r17/evaluation.json` and `evidence/task-4-2-integrated-two-slice-capture-replay-r17/evaluation.json` are terminal `complete`; replay makes zero calls. All 18 evaluator rows are true. Raw evidence records 51 completed exact-route responses with zero response errors: 42 for slice-b and 9 for slice-a. Both executor results are `completed`, `guardState=passed`, `writerClosure=terminal`, `cleanup=complete`, and use distinct root refs. The 13-transition chain is `preflight`, slice-b session/archive/checkpoint, one `successor-activation`, slice-a session/archive/checkpoint, and `terminal-stop`; durable state is `complete` at cursor `1`. OpenSpec readback has zero active changes and exactly `2026-08-25-change-a` plus `2026-08-25-change-b`; local checkpoint subjects are slice-a then slice-b; markers are exact `alpha\n` and `beta\n`; tasks are checked; remotes are empty. The controller PTY is terminal, three roots were deleted, and fixture cleanup is complete. The redundant post-run validator still reports `ETIMEDOUT`/`SIGTERM`, but the previously selftested composed oracle is green from both phase validation statuses, terminal durable state, two archives, and both checkpoints; it does not weaken any accepted validation fact. The SDK wrapper also retains its known handled-command `Unexpected server error` sentinel while the launcher, controller, and final state are directly observed.
- **Outcome:** Task 4.2 is complete. Candidate r14 restores `Development-Stage: MVP` and extends it through installed two-slice auto-chain. Task 4.3 and later accepted scope remain open.
- **Reason:** R17 is the first single bundle to combine exact queued admission, configured propose/apply/continue behavior, two fresh roots, ordered archive/checkpoint/successor activation, terminal queue exhaustion, cockpit visibility, no third outcome, no remote, and terminal cleanup.
- **Do-Not-Repeat Condition:** Do not rerun r17 or any earlier task 4.2 capture/preflight/selftest merely to reconfirm auto-chain, and do not convert its redundant post-run validator or handled-command sentinel into a Product Candidate failure without new contradictory direct evidence.
- **Evidence-Based Retry Condition:** Re-enter task 4.2 only after scoped invalidation of controller auto-chain, executor phase behavior, queued-active admission, capture/evaluator semantics, or the OpenCode environment identity. Otherwise continue to task 4.3 using preserved/offline evidence first.

## 2026-08-25 - Task 4.3 owner-required r1 exposed a stale proof verdict shape

- **Objective:** Refresh the owner-required installed-runtime lane after later completion-guard/status mutations while keeping configured-provider work locked.
- **Approach:** Ran the existing isolated local-provider owner-required scenario against candidate r14, closed every root/process/fixture, and replayed the immutable bundle with zero live calls. Compared the simulator response with the current completion-verdict parser and direct question/owner oracle.
- **Evidence:** `evidence/task-4-3-owner-required-r1/evaluation.json` and `evidence/task-4-3-owner-required-replay-r1/evaluation.json` are terminal `blocked`; replay records `liveCalls=0`. Capture made exactly one primary and one arbiter call, deleted the root, and completed cleanup, but the executor returned terminal `guardState=error`. The simulator omitted `claimMatrix`, while current `verdict.ts` requires an array and the current green `proof:guard-question` owner verdict includes `claimMatrix: []`. The r1 raw bundle retained only server stream lengths, not the owning guard error line.
- **Outcome:** Proof Runner fixture/diagnostic defect, not evidence of a Product Candidate owner-handoff regression. The owner lane remains locked until the corrected simulator is re-proved once.
- **Reason:** The simulator retained the pre-claim-closure verdict schema after the guard parser changed. The missing bounded server diagnostics made the generic guard error need source correlation.
- **Do-Not-Repeat Condition:** Do not rerun r1, infer product failure from `completion guard ended in error`, or launch a configured task-4.3 attempt.
- **Evidence-Based Retry Condition:** Add the required empty `claimMatrix`, preserve bounded redacted server error lines and current guard source hashes in future raw bundles, pass direct question/focused guard checks and source diagnostics, then run one create-new local owner-required capture and immutable replay.

## 2026-08-25 - Task 4.3 failure and recovery corpus completed

- **Objective:** Close owner-required, bounded autonomous question, compaction, local blocker recovery, admission rejection, malformed-result, crash, hard-kill, runtime-loss, and unknown-writer cases on candidate r14 without another configured-provider invocation.
- **Approach:** Corrected only the stale local owner simulator verdict shape, added bounded redacted runtime diagnostics/current source hashes, refreshed the installed owner-required lane and replay, added a compaction lifecycle oracle to the existing direct guard proof, ran fresh current contract/admission, hard-kill/replay, and provider-free local-blocker bundles, and reconciled the preserved runtime-loss replay by branch-scoped invalidation.
- **Evidence:** `evidence/task-4-3-lane-matrix-r1/evaluation.md` records the complete lane mapping. Owner r2 and replay are `complete` with exit 3, guard/question/error `owner-required`, terminal writer, deleted root, complete cleanup, and zero replay calls. `proof:guard-question` reports all autonomous and compaction checks true. Contract/admission r1 is `complete` with zero project mutations and fail-closed malformed, dirty, unlisted, live, pending-question, and unreadable cases. Hard-kill r1 and replay are `complete` with active ownership preserved and `paused-unknown`. Local-blocker simulate r1 records one status-75 local failure, a deterministic changed mechanism, two archives, one successor activation, terminal completion, zero configured calls, and complete cleanup. The preserved launcher runtime-loss replay remains terminal `complete` and does not intersect r14's successful post-checkpoint successor branch.
- **Outcome:** Task 4.3 is complete. The task-4.3 live-attempt gate is clear; no configured-provider call is needed for these deterministic cases. Candidate r14 remains `Development-Stage: MVP` because installation, complete-candidate proof, SDET, and final qualification tasks remain open.
- **Reason:** Each case is owned by an existing real or nearest-safe boundary and has current or dependency-scoped evidence. The only fresh failure was a proof fixture omitted by the newer verdict schema; its immutable replay and corrected installed capture close that chain without product mutation.
- **Do-Not-Repeat Condition:** Do not rerun the task-4.3 captures/replays, launch a configured task-4.3 case, or generalize this exact disposable corpus to target-project or cross-version readiness.
- **Evidence-Based Retry Condition:** Re-enter only after scoped mutation of the corresponding admission, result, question/compaction, owner handoff, local recovery, process/PTY liveness, or evaluator boundary. Replay preserved raw evidence first for evaluator-only changes.

## 2026-08-25 - Installed `all` launcher r1 omitted server diagnostics

- **Objective:** Prove a pristine generated `all` profile through the existing launcher capture from run to status to terminal state with zero provider calls.
- **Approach:** Materialize `all` into the disposable config directory, keep default plugins disabled, and invoke the existing launcher capture without copying a model catalog or host authentication.
- **Evidence:** `evidence/task-5-1-installed-launcher-r1` records registered commands, `run` returning `UnknownError`, an empty status observation, zero provider calls, and complete cleanup. It does not retain a server output tail.
- **Outcome:** Evidence-only failure before a mission observation. No Product Candidate mutation was made.
- **Reason:** The failed-capture finalizer omitted the server diagnostics needed to distinguish pre-hook model resolution from launcher-hook behavior.
- **Do-Not-Repeat Condition:** Do not rerun this capture without retaining bounded redacted server stdout/stderr tails.
- **Evidence-Based Retry Condition:** Preserve failed-capture tails and name a causally different mechanism from those diagnostics; do not retry merely to acquire the same empty status.

## 2026-08-25 - Installed `all` launcher r2 identified pre-hook model resolution

- **Objective:** Re-run the same installed-profile boundary with the missing diagnostic channel.
- **Approach:** Retain bounded redacted stdout/stderr tails while leaving the isolated no-catalog, no-auth, default-plugins-disabled environment unchanged.
- **Evidence:** `evidence/task-5-1-installed-launcher-r2` records `ProviderModelNotFoundError: Model not found: openai/gpt-5.6-sol` at `SessionPrompt.getModel`, an empty status observation, zero provider calls, and complete cleanup.
- **Outcome:** Diagnosis only. The launcher hook did not execute because OpenCode resolved the configured session model first.
- **Reason:** The isolated serve could not resolve the pinned model before command-hook dispatch.
- **Do-Not-Repeat Condition:** Do not repeat the no-catalog isolated-`all` capture expecting a different first failing line.
- **Evidence-Based Retry Condition:** Use a new mechanism that changes how OpenCode resolves `openai/gpt-5.6-sol` without host authentication, or a provider-free command path that does not call `getModel`.

## 2026-08-25 - Installed `all` launcher r3 catalog copy did not activate OpenAI

- **Objective:** Unblock pinned-model lookup without copying authentication.
- **Approach:** Copy the host model catalog into the disposable XDG cache, matching the integrated proof's catalog placement while retaining zero-call assertions.
- **Evidence:** `evidence/task-5-1-installed-launcher-r3` records the same `ProviderModelNotFoundError` at the same pre-hook boundary, zero provider calls, and complete cleanup.
- **Outcome:** Catalog placement did not change the failing boundary.
- **Reason:** Catalog presence supplies model identities but does not activate the OpenAI provider in this isolated runtime.
- **Do-Not-Repeat Condition:** Do not treat `models.json` copy as sufficient for generated-`all` serve-plus-command.
- **Evidence-Based Retry Condition:** Only retry catalog placement if a distinct supported provider-activation mechanism is first proven to change the resolver result.

## 2026-08-25 - Installed `all` launcher r4 project provider overlay was insufficient

- **Objective:** Activate only OpenAI while leaving default plugins disabled and authentication out of the proof lane.
- **Approach:** Add a project-layer `enabled_providers: ["openai"]` overlay and disable other catalog providers.
- **Evidence:** `evidence/task-5-1-installed-launcher-r4` records the same pre-hook `ProviderModelNotFoundError`, zero provider calls, and complete cleanup.
- **Outcome:** The project overlay did not activate the provider.
- **Reason:** Provider selection in project config cannot replace the disabled provider-loading mechanism in this isolated runtime.
- **Do-Not-Repeat Condition:** Do not retry a project-only provider overlay for this runner/profile pair.
- **Evidence-Based Retry Condition:** Re-enter only with direct evidence that the overlay is loaded into, and changes provider resolution for, the isolated serve used by this runner.

## 2026-08-25 - Installed `all` launcher r5 default plugins without auth still failed

- **Objective:** Match the integrated runner's default-plugin startup without importing host credentials.
- **Approach:** Allow default plugins for the `all` lane while retaining isolated config/data and the zero-provider-call requirement.
- **Evidence:** `evidence/task-5-1-installed-launcher-r5` records the same pre-hook `ProviderModelNotFoundError`, zero provider calls, and complete cleanup.
- **Outcome:** Default plugins without authentication did not resolve the pinned route.
- **Reason:** The isolated runtime still lacked the credential-backed OpenAI activation required by `SessionPrompt.getModel`.
- **Do-Not-Repeat Condition:** Do not re-enable default plugins on this lane expecting model resolution without credentials.
- **Evidence-Based Retry Condition:** Only retry if new evidence shows default plugins can resolve `openai/gpt-5.6-sol` in this isolated XDG root without `auth.json`.

## 2026-08-25 - Installed `all` launcher r6 config overlay repeated the pre-hook failure

- **Objective:** Enable OpenAI on the generated config itself while preserving the pristine generated-config digest.
- **Approach:** Record `generatedConfigSha256`, then add disposable `enabled_providers` and `disabled_providers` fields to the generated `opencode.json` before command dispatch.
- **Evidence:** `evidence/task-5-1-installed-launcher-r6` records generated digest `9053274c39fc90578d2ea6c6f2a963fc2eae673a3602311865bb33e4320cf214`, the overlay, the same pre-hook `ProviderModelNotFoundError`, zero provider calls, and complete cleanup.
- **Outcome:** The changed config did not advance beyond model lookup. The temporary `--runtime-profile all` launcher-capture mode was removed after this attempt.
- **Reason:** This remained the same runner/evaluator/first-failing-line chain and could not prove installation behavior without importing host authentication authority.
- **Do-Not-Repeat Condition:** Do not restore `--runtime-profile all`, overlay generated `all` to chase `session.command`, or copy host `auth.json` into the task-5.1 lane.
- **Evidence-Based Retry Condition:** Re-enter only through a different owner that executes mission commands without `SessionPrompt.getModel`, or after a changed OpenCode environment proves file-plugin configs plus the cached catalog resolve the pinned route without credentials.

## 2026-08-25 - Task 5.1 installed profile and operator contract completed

- **Objective:** Close installation, diagnostics, CLI/help, profile, and operator-documentation scope without repeating the blocked generated-`all` serve-plus-command lane.
- **Approach:** Reused the shared portable-workflow and roadmap-mission source inventories across installer, doctor, validators, fixtures, and loader proof; aligned preview and migration planning on `--profile <core|all>`; added explicit generated-profile selection to print and persist-script modes while preserving unprofiled legacy behavior; and accepted the installed boundary by composing current disposable install/doctor/source readback and pristine generated-config loading with the already-complete current launcher/cockpit/status/stop runtime evidence. No generated profile was persisted to the host shell.
- **Evidence:** `evidence/task-5-1-install-doctor-r5/evaluation.json` is terminal `complete` with `runtimeSurfaceInstall=all-profile-pass`, installed unattended mission readiness `pass`, ordinary qualification `pass`, preserved legacy overlay, and complete cleanup. `evidence/task-5-1-runtime-loader-r4/evaluation.json` is `passed`; its raw bundle loads exactly one PTY bridge, roadmap launcher, and completion guard from generated `all`, exposes all four mission commands, retains `openai/gpt-5.6-sol`, and reports zero staging paths or unresolved placeholders with complete cleanup. Focused install tests are 30/30 and library tests are 177/177. `--preview-profile --profile all`, `--plan-migration --profile all`, and `--print --profile all` are effect-free and successful; both mission CLIs print help without effects. Current `validate:strict` is green with zero warnings, `openspec:validate` is 22/22, and `git diff --check` reports line-ending warnings only. The schema-valid `task-5-1-install-doctor-loader` evidence lane resolves all four r5/r4 files with indexed sizes and SHA-256 digests.
- **Outcome:** Task 5.1 is complete. Default installation remains `core`; mission runtime is available only from generated `all`; status/help remain non-mutating; run/resume remain fail-closed when cockpit/runtime prerequisites are unavailable. This composition does not claim that the abandoned generated-`all` `session.command` path can resolve the configured provider without credentials, and it does not close task 6.1.
- **Reason:** Installation and operator-contract ownership is fully observed through its actual disposable install, doctor, source-inventory, generated-loader, help, and documentation boundaries. The six launcher attempts all failed before the launcher hook at OpenCode model resolution and therefore cannot invalidate the separately observed installed files or current runtime behavior.
- **Do-Not-Repeat Condition:** Do not restore `--runtime-profile all`, retry launcher r1-r6, copy host authentication into this lane, put mission plugins into default `core`, persist generated `all` to the live shell merely to reconfirm installation, or infer task 6.1 completion from this composed boundary.
- **Evidence-Based Retry Condition:** Re-enter task 5.1 only after scoped mutation of installer/profile materialization, mission source inventories, doctor/validator semantics, generated loader behavior, CLI/help, or operator documentation. Task 6.1 remains separately blocked from live capture until its offline inventory reconciles the preserved corpus, including current task rows and unindexed retained evidence, and names an exact missing raw observation or a complete current proof chain.

## 2026-08-25 - Task 6.1 offline inventory closed the current deterministic gaps

- **Objective:** Bind every delta-spec scenario to current source and a compatible environment before any task-6.1 installed configured capture, without restoring the abandoned generated-`all` command lane.
- **Approach:** Extended only the existing provider-free contract and launcher-stop proof owners. The contract owner now proves roadmap prose cannot change executable scope, unlisted active changes reject directly, invalid/credentialed/non-loopback runtime URLs reject, a closed stale loopback origin terminates before session creation, and runtime project/capability mismatches fail closed. The launcher owner now proves controller preflight through the shared PTY manager plus cockpit-open failure before spawn and status visibility, while retaining graceful stop, hard-kill, stream, and runtime-loss oracles. Re-ran the contract owner under the same Bun runtime as the launcher lane.
- **Evidence:** `evidence/task-6-1-current-source-contract-r5/evaluation.json` is terminal `complete` with zero project mutations and direct rows for prose-owned scope, unlisted admission, stale runtime `terminal-before-session`, missing/non-loopback/credentialed URL rejection, directory mismatch, and missing canonical command. Its raw Environment Identity is Bun `1.3.14`, Node compatibility `v24.3.0`, Windows, and `bun.exe`; it hashes the current executor wrapper `e5f243d29c247280e3d7be6eb45fddafc502daf70a9658f4748bc4043a783128`, inner executor `6ca220ffc342ed2db0d42ed30d55e72bd32eef28754e6009707f4bed282dec60`, controller `e19fdc98ba08285b58bc39d53d439e48a0ae4e0fdddb7a9b60fb1e8e2d6cc81c`, and roadmap entry point `6df1c2f293a41df4e48a6bb482ec1844d0f6847e5102f43e2626b4715661747b`. `evidence/task-6-1-current-source-launcher-r3/evaluation.json` and zero-call replay are terminal `complete`; all 20 checks are true, cleanup is complete, provider calls are zero, cockpit failure leaves PTY count unchanged with `visibility=not-opened`, and current launcher/bridge hashes are `3832b497cc384ed4e1a13d91455dabbc93f669a5d1412a07fdd3f4ddce66f599` / `47ba676ac221168c90cde9bfbd9889393f5cd0d7170cfc01a5b16aa8d67179bc`. Launcher r1 and r2 both timed out before controller stream prefixes; r1 cleanup completed, r2 reported cleanup failure but PID `13612` was verified absent before further work. A minimal Bun PTY command and controller `--help` then passed through the same manager, and r3 added the causally distinct controller-preflight probe before completing the full lane. Contract r1 rejected only an incorrect capability-message oracle; r4 observed the required stale-runtime fail-closed result but rejected it because the proof expected `transient` instead of the specification-permitted `terminal`; both oracles were corrected without production mutation. Earlier contract r2/r3 remain narrower successful bundles.
- **Outcome:** The three previously missing raw observations are closed on current source. Provider-free task-6.1 lanes now share one runtime family and source identity with configured r17's current controller/executor/launcher hashes. The exact remaining observation is the complete installed configured two-slice operator chain plus terminal evaluator/finalization on one readable task-6.1 Candidate Reference; it is not inferred from these local rows. The live-attempt gate is clear for one fresh current-runner integrated preflight and, only if that preflight is terminal-green, one bounded configured capture through the already successful isolated integrated mechanism. This is not a candidate freeze and does not create `r15`.
- **Reason:** Scenario ownership is now direct rather than inferred from prose, help, installation hashes, or unrelated lanes. The generated-`all` r1-r6 failure remains a separate pre-hook provider-resolution limitation; the integrated staged lane is a causally different, previously successful route that records the required OpenCode/model/session/PTy/controller effects.
- **Do-Not-Repeat Condition:** Do not rerun launcher r1/r2, contract r1/r4, generated-`all` launcher r1-r6, configured r17, or any green deterministic lane merely to rename its candidate. Do not restore `--runtime-profile all`, copy host `auth.json`, attach to host `:4096`, change route/version/profile/variant/timeouts, freeze `r15`, or treat the local bundles as task-6.1 completion.
- **Evidence-Based Retry Condition:** Run one current `roadmap-mission-integrated.ts` two-slice preflight with an exact new task-6.1 Candidate Reference under OpenCode `1.18.22`, `openai/gpt-5.6-sol`, `quality-independent`, `xhigh`, and the established isolated envelope. Only a terminal-green preflight unlocks one configured capture with that same reference. Preserve the complete raw bundle, close every root/process/session/PTY/fixture, replay the evaluator and all reachable non-side-effecting finalization checks offline, and block any further live attempt at the first non-complete boundary.

## 2026-08-25 - Task 6.1 configured capture and current owner lane completed

- **Objective:** Bind the final configured two-slice operator chain and current owner-required wrapper to one readable content-bound task-6.1 Candidate Reference without restoring the abandoned generated-`all` command mechanism.
- **Approach:** Ran one terminal-green current integrated preflight and zero-call replay, one authorized configured capture under OpenCode `1.18.22` with `openai/gpt-5.6-sol` / `quality-independent` / `xhigh`, immutable evaluator replay and finalizer selftest, then a current local-provider owner-required capture. The first owner attempt ended at an unready proof arbiter route with complete cleanup; the proof runner added one shared route canary and the causally changed r2 capture completed.
- **Evidence:** `evidence/task-6-1-integrated-two-slice-{preflight-r1,preflight-replay-r1,capture-r1,capture-replay-r2}` and `evidence/task-6-1-integrated-finalizer-selftest-r1` are terminal `complete`; capture records 49 completed responses, zero response errors, the 13-transition two-slice auto-chain, three deleted roots, no remote, and complete cleanup. Replay r2 records `replay.liveCalls=0`. `evidence/task-6-1-owner-required-current-r2` and replay r2 are terminal `complete` with current wrapper/guard source hashes, `owner-required`, terminal writer, deleted root, and zero replay calls. The superseded r1 owner bundle is terminal-blocked with cleanup complete.
- **Outcome:** The exact configured happy path and current owner-required partition are closed on Candidate Reference `add-autonomous-roadmap-mission-runtime-task-6-1-r1`. No additional configured or generated-`all` live attempt is authorized by task 6.1.
- **Reason:** Product Candidate identity is the source content recorded across the manifest's named owners. Proof-attempt candidate labels and historical Environment Identities do not become one runtime merely because source hashes overlap.
- **Do-Not-Repeat Condition:** Do not rerun the configured capture, owner r1/r2, generated-`all` launcher r1-r6, copy host auth, attach to host `:4096`, restore `--runtime-profile all`, or freeze an unrecorded r15.
- **Evidence-Based Retry Condition:** Re-enter a runtime lane only after dependency-scoped mutation of its Product Candidate, Proof Runner, Evaluator, or Environment Identity. Replays precede any live attempt.

## 2026-08-25 - Task 6.1 evidence challenge narrowed composition to observed lanes

- **Objective:** Challenge the broad complete-candidate claim after capture and close only the maximum evidence-supported ceiling.
- **Approach:** Ran a fresh read-only evidence-sufficiency review over all 19 delta-spec scenarios, the candidate manifest, configured/current provider-free bundles, generated-`all` install/loader evidence, historical task-4.3 bundles, and current validation facts. Dispositioned every risk in `evidence/task-6-1-candidate-reference-r1/evidence-sufficiency-review-r2.md`.
- **Evidence:** The review attributed exact configured, contract, launcher, and owner-required rows as supported or narrowed, but rejected one configured runtime spanning question, compaction, and local-blocker; identified local-blocker and task-4.3 hard-kill as r14-only identities; identified loader r4 as path-only; and required candidate-bound compaction and validation records. Proposal Observable Proof, Design Decision 8, task 6.1, and the manifest now state the configured happy path plus separately attributed deterministic lanes. Current `npm run proof:guard-question` exited `0`; `compaction-{raw,evaluation}.json` bind its direct oracles and source identities.
- **Outcome:** The one-runtime-every-partition claim remains unsupported and removed. The narrower finite per-lane claim remains eligible for completion after candidate-bound validation and proof-inventory reconciliation.
- **Reason:** Simultaneity is not a product requirement, but evidence identity and environment attribution are. The correction changes implementation controls and claim wording, not accepted product behavior.
- **Do-Not-Repeat Condition:** Do not infer current-candidate local-blocker/hard-kill from r14, source hashes from loader paths, configured profile from raw route fields, or configured compaction from component proof.
- **Evidence-Based Retry Condition:** No live retry. Complete current offline validation, bind it durably, and make the proof inventory current.

## 2026-08-25 - Zero-argument proof aliases failed closed on required inputs

- **Objective:** Run task 6.1's named current offline proof inventory without creating an unintended runtime lane.
- **Approach:** Invoked the package aliases without guessed arguments, then used their effect-free help where supported to recover the exact contracts.
- **Evidence:** `proof:guard-question` exited `0`. `proof:project-unattended`, `proof:roadmap-state`, and `proof:roadmap-controller` reported missing safe candidate ids; `proof:roadmap-mission` required `--mode`; `proof:roadmap-launcher-stop` required capture/replay mode. No configured provider was called and no Product Candidate defect was observed. Effect-free help showed create-new evidence roots for project-unattended and capture/replay inputs for the contract/controller/launcher runners. `proof:roadmap-state --help` itself reports unsupported option and is not used as task-6.1 runtime evidence.
- **Outcome:** Invocation/Proof Runner input error only. Existing current terminal replays remain valid; the one missing project-unattended validation lane must use a new candidate-bound disposable evidence root.
- **Reason:** These package aliases are parameterized maintained proof CLIs rather than zero-argument test scripts.
- **Do-Not-Repeat Condition:** Do not repeat any zero-argument alias or invent a state-runner mode.
- **Evidence-Based Retry Condition:** Run `proof:project-unattended` once with Candidate Reference `add-autonomous-roadmap-mission-runtime-task-6-1-r1` and one new absolute evidence root. Resolve existing task-6.1 replay lanes through their recorded bundles rather than recapturing them.

## 2026-08-25 - Task 6.1 current validation and evidence reconciliation completed

- **Objective:** Close task 6.1 only after current installed-readiness, focused/project-native validation, bounded index readback, and the corrected per-lane claim all agree on one Candidate Reference.
- **Approach:** Ran the causally corrected project-unattended proof once with the exact Candidate Reference and a new evidence root; ran focused guard/install/library tests, strict library validation, all OpenSpec validation, strict change validation, the apply operation gate, the current compaction/question proof, and the bounded evidence resolver. Replaced the oversized historical lane listing in the stable index with only current terminal 5.1/6.1 lanes while leaving historical bundles untouched under the declared temporary exception.
- **Evidence:** `evidence/task-6-1-project-unattended-r1/{raw,evaluation}.json` is terminal `complete`, binds generated `all` mission source digests to the candidate, reports unattended readiness and ordinary qualification `pass`, and cleanup complete. `evidence/task-6-1-candidate-reference-r1/validation.md` records guard `45/45`, install `30/30`, library `177/177`, `validate:strict` warnings `0`, OpenSpec `24/24`, strict change valid, apply gate passed, compaction/question green, and candidate-freeze lane resolution. The evidence inventory reports 12 checked tasks with 12 current rows and no incomplete, stale, mismatched, or unknown checked task. The bounded index is 15,900 bytes after the current-lane transition.
- **Outcome:** Task 6.1 is eligible to close on Candidate Reference `add-autonomous-roadmap-mission-runtime-task-6-1-r1` at the manifest's per-lane claim ceiling. Task 6.2 fresh SDET is the next dependency-valid boundary.
- **Reason:** Current source-bound runtime evidence, exact scenario attribution, candidate-bound validation, terminal cleanup, and independent evidence challenge now converge. The remaining historical-retention finding is explicitly post-freeze/pre-archive work and does not authorize deletion during 6.1.
- **Do-Not-Repeat Condition:** Do not rerun configured capture, current green deterministic captures/replays, or zero-argument aliases. Do not delete retained history before the declared pre-archive cleanup boundary.
- **Evidence-Based Retry Condition:** Re-enter task 6.1 only after scoped Product Candidate, relevant Environment, Proof Runner, Evaluator, scenario-map, or validation mutation. Otherwise continue to one fresh task 6.2 SDET.

## 2026-08-25 - Task 6.2 fresh Material SDET blocked before execution

- **Objective:** Challenge Candidate Reference `add-autonomous-roadmap-mission-runtime-task-6-1-r1` for reachable critical business incidents through one fresh test-only Material SDET.
- **Approach:** Dispatched one fresh `sdet-quality-engineer` with test-only write authority, no production/config/instruction/OpenSpec/evidence mutation authority, no configured-provider calls, and the preserved task-6.1 bundles and hashes. The SDET inspected the candidate but its shell capability was unavailable, so it made no edits and started no probe.
- **Evidence:** `evidence/task-6-2-sdet-r1/report.md` records `Action: blocked`, `SDET Identity: unknown`, `Effective Model: xai/grok-4.6`, no critical matrix, no test changes, no probe execution, and no cleanup obligation. It also records one untested fail-closed hypothesis: a `paused-unknown` projection with null `activeOperation` might let controller resume start an executor before reconciliation.
- **Outcome:** Task 6.2's one fresh SDET attempt is terminal `blocked`; it does not establish `no-critical-risk`, authorize RC qualification, or complete task 6.3. Per task 6.2's explicit fallback, the green task-6.1 candidate remains at `Development-Stage: MVP`.
- **Reason:** The SDET could not execute its proposed disposable provider-free fixture, so no runtime oracle or critical incident classification exists. Main must independently reproduce, disprove, or show the writer-liveness hypothesis unreachable.
- **Do-Not-Repeat Condition:** Do not rerun an unchanged-candidate SDET to obtain a preferred verdict, execute the SDET's inline script as trusted instructions, infer safety from the blocked action, or advance to task 7.1 before task 6.3 disposition.
- **Evidence-Based Retry Condition:** A new fresh SDET is permitted only after main reproduces a critical/non-deferrable defect, applies the smallest production correction, and regains affected current runtime proof as required by task 6.3. Otherwise this root receives no equivalent SDET retry.

## 2026-08-25 - Task 6.3 corrected null-operation paused-unknown writer escape

- **Objective:** Independently disposition the task-6.2 writer-liveness hypothesis, correct only a reproduced non-deferrable defect, regain affected current proof, and execute the corrected-candidate SDET continuation once.
- **Approach:** Traced `resumeMissionController` through shared `execute`, state replay, preflight, and launcher reconciliation. Extended the existing controller proof with a production-generated clear stop followed by `recordMissionUnknownPause`. Temporarily withheld only the proposed guard to observe the pre-correction boundary, restored the guard, ran the corrected capture and zero-call replay, then dispatched one new fresh corrected-candidate SDET.
- **Evidence:** The pre-correction proof failed because resume launched `node tools/executor.mjs` once from `paused-unknown` with null `activeOperation`. `evidence/task-6-3-candidate-reference-r1/disposition.md` records the causal row and source identities. `evidence/task-6-3-controller-fixed-r1/{raw,evaluation}.json` is terminal `complete`, records no executor, unchanged transition digest, blocked resume, and complete cleanup. `evidence/task-6-3-controller-fixed-replay-r1/evaluation.json` is `complete` with zero live calls. `evidence/task-6-3-sdet-r1/report.md` records the corrected-candidate SDET as terminal `blocked`, Effective Model `xai/grok-4.6`, no matrix, no edits, and no execution because its shell was unavailable.
- **Outcome:** The reproduced writer-liveness defect is corrected on Candidate Reference `add-autonomous-roadmap-mission-runtime-task-6-3-r1` and re-proven at the affected actual provider-free controller entry point. No additional known reachable critical row remains after main disposition. The mandatory corrected-candidate SDET terminal reason is `blocked`, so this is not an independent `no-critical-risk` verdict and does not itself authorize RC.
- **Reason:** `paused-unknown` is the durable fail-closed fact; nullable operation metadata cannot safely weaken it. The smallest owner-local guard prevents preflight, lease, executor, and archive work while retaining existing active-operation rejection and all bounded recovery behavior.
- **Do-Not-Repeat Condition:** Do not rerun the unchanged corrected candidate through another SDET to seek a preferred verdict, repeat the pre-fix mutation-authority escape, remove the disposition guard, or broaden the correction into launcher scheduling or restart-reconciliation design.
- **Evidence-Based Retry Condition:** Re-enter SDET only after another main-confirmed critical defect and production correction materially changes reachable critical behavior. Re-enter the controller proof only after controller/state/preflight/proof-runner mutation or a current evaluator inconsistency.

## 2026-08-25 - Task 7.1 MVP-stage qualification handoff completed

- **Objective:** Run the full local validation, current installed loader/doctor readback, evidence reconciliation, and terminal handoff against the corrected task-6.3 Candidate Reference.
- **Approach:** Ran fresh provider-free project-unattended and generated-`all` loader proofs, self-hosted doctor qualification, full serial repository tests, strict library validation, all OpenSpec validation, strict change validation, diff checks, and bounded evidence-index/inventory readback. Preserved the blocked corrected-candidate SDET terminal reason instead of promoting it to an independent safety verdict.
- **Evidence:** `evidence/task-7-1-project-unattended-r1` is terminal `complete`, binds installed controller digest `91dfa43b9994634d5503cc4f82702d8f9201eaa3b3e067ee5003d09e9e360d29`, reports generated `all` install and unattended readiness `pass`, and cleanup complete. `evidence/task-7-1-runtime-loader-r1` is `passed` with all four mission commands, no missing plugins, no staging paths or placeholders, and cleanup complete. `evidence/task-7-1-candidate-reference-r1/validation.md` records `npm test` exit `0`, strict validation with zero warnings, OpenSpec `24/24`, strict change valid, doctor qualification `pass`, and clean diff checks.
- **Outcome:** Task 7.1 is complete as an MVP-stage local handoff. Candidate Reference `add-autonomous-roadmap-mission-runtime-task-6-3-r1` is working at the recorded per-lane ceiling, but no RC is frozen because both mandatory SDET contexts were unable to execute independently.
- **Reason:** Current runtime, installed source identity, deterministic proof, and project-native checks are green. Lifecycle evidence remains bounded by the SDET terminal `blocked` actions, so the handoff records working software without inventing `no-critical-risk`, RC, or stable status.
- **Do-Not-Repeat Condition:** Do not rerun green provider-free/install/loader checks merely to rename the candidate, seek an unchanged-candidate SDET verdict, run another configured capture without a dependency-scoped mutation, or claim RC from main-authored proof.
- **Evidence-Based Retry Condition:** Re-enter qualification only after scoped Product Candidate, relevant proof/evaluator, installed profile, validation, or SDET capability mutation. Before archive, perform only the declared historical evidence-corpus reduction and deterministic archive gates.

## 2026-08-25 - Pre-archive evidence corpus reduced to current terminal lanes

- **Objective:** Satisfy the evidence index's declared post-freeze/pre-archive cleanup rule without deleting any current raw, evaluator, replay, limitation, SDET, or handoff evidence.
- **Approach:** Added one reviewed current-terminal corpus lane, resolved all of its files and digests, then derived the deletion set from the repository's authoritative evidence inventory. The cleanup invocation required exact count `697`, byte total `7,310,866`, and sorted path-list digest `8d461dbd9835e78927411139c54ac741f2ab922ead5f7f9d5ca24f219cd3c4c4`; it rejected escaping, non-regular, or symbolic-link paths before deleting any file.
- **Evidence:** `evidence/task-7-1-candidate-reference-r1/retention-cleanup.md` records the bounded facts. Before cleanup the change retained `749` files / `7,836,452` bytes with `697` unindexed. The reviewed current terminal corpus contained `52` files / `525,586` bytes, including complete configured raw/replay, current deterministic partitions, r14-attributed limitation bundles, task-6.3 correction/SDET, and task-7.1 installed handoff evidence.
- **Outcome:** All `697` superseded unindexed files were deleted and all indexed current files were preserved. The temporary 750-file / 8-MiB exception can be removed after inventory readback.
- **Reason:** Complete archive should retain current evidence and decision-relevant causal limitations, not every superseded diagnostic and failed attempt bundle.
- **Do-Not-Repeat Condition:** Do not restore superseded bundles, delete an indexed file, or broaden cleanup to another active change.
- **Evidence-Based Retry Condition:** Re-enter cleanup only if inventory readback reports a concrete unindexed file or a digest/size mismatch in a retained lane.
