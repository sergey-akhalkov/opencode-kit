# Strategy History

## 2026-08-09 - Reuse the optional delivery reviewer as the runtime arbiter

- **Objective**: Reuse existing root-goal and delivery-evidence logic with the fewest new agent artifacts.
- **Approach**: Modify `session-delivery-reviewer` so the completion plugin could invoke it after root idle and consume a completion verdict.
- **Evidence**: The active agent contract makes the reviewer optional after MVP, requires a risk matrix, and explicitly forbids acceptance/rejection verdicts and lifecycle authority. Active validators, profiles, instructions, and tests bind those semantics.
- **Outcome**: Rejected. Create a hidden `session-completion-arbiter`, migrate the useful evidence checks, then remove the active old reviewer only after guard proof.
- **Reason**: One role cannot remain an optional non-authorizing reviewer while also serving as an always-on machine adjudicator without contradictory authority and output contracts.
- **Do Not Repeat**: Do not add an arbiter mode or verdict exception to the old reviewer prompt.
- **Evidence-Based Retry Condition**: Reconsider only if OpenCode gains a first-class completion-adjudicator role whose platform contract safely unifies those authorities and the active kit reviewer contract is independently retired.

## 2026-08-09 - Infer PTY waiting from transcript messages

- **Objective**: Prevent completion audits while the root waits for `opencode-pty` with minimal integration code.
- **Approach**: Track `pty_spawn` tool output and wait for a matching `<pty_exited>` prompt; use transcript state as the source of truth.
- **Evidence**: `opencode-pty` catches and ignores notification-send errors; a process may exit before spawn correlation completes; PTYs may be killed through the PTY UI; transcript delivery and live process state are separate boundaries.
- **Outcome**: Rejected. PTY waiting must be resolved programmatically through a lease registry plus the live exported manager.
- **Reason**: Missing or delayed prompt delivery can leave a false running lease or permit a premature model audit.
- **Do Not Repeat**: Do not use model prose, final assistant text, or unmatched transcript tags as proof of PTY liveness.
- **Evidence-Based Retry Condition**: Reconsider only if `opencode-pty` exposes a durable session-owned lease/event protocol with acknowledged notification delivery that is stronger than the live manager contract.

## 2026-08-09 - Reconcile external PTYs through OpenCode client.pty

- **Objective**: Avoid depending on `opencode-pty` internals by using an official SDK list API.
- **Approach**: Query `client.pty.list()` and OpenCode `pty.*` events before each completion audit.
- **Evidence**: The SDK PTY API describes OpenCode's built-in PTY subsystem. The configured external `opencode-pty` package maintains its own in-process manager and custom tools; no evidence links those sessions to `client.pty.list()`.
- **Outcome**: Rejected. The guard must not claim that the built-in PTY API reconciles external plugin sessions.
- **Reason**: The two PTY systems have different ownership and event surfaces.
- **Do Not Repeat**: Do not use `client.pty.list()` as external `opencode-pty` proof without a live identity test that shows the same PTY id in both systems.
- **Evidence-Based Retry Condition**: Retry only if a future `opencode-pty` version explicitly registers its sessions in the OpenCode PTY service and a disposable runtime test proves shared ids and transitions.

## 2026-08-09 - Import the manager from a separately resolved package copy

- **Objective**: Query live `opencode-pty` state directly from the completion guard.
- **Approach**: Keep the config entry `"opencode-pty"` and import its deep manager export from the kit guard.
- **Evidence**: OpenCode resolves the configured package under `C:/Users/Sergey/.cache/opencode/packages/opencode-pty`, while kit plugins resolve imports from `global/node_modules`. Separate resolved module files create separate manager singletons; the guard copy would be empty.
- **Outcome**: Rejected. Pin the package in `global/package.json` and load both a kit PTY bridge and guard from that one dependency graph.
- **Reason**: Singleton identity is a runtime correctness requirement, not an implementation detail.
- **Do Not Repeat**: Do not depend on cache paths, dynamic package-cache discovery, or unproved module-cache sharing.
- **Evidence-Based Retry Condition**: Reconsider only if OpenCode exposes a supported plugin-to-plugin service registry or `opencode-pty` publishes a process-wide API independent of module identity.

## 2026-08-09 - Stop after a fixed number of continuation cycles

- **Objective**: Prevent the main session from working forever.
- **Approach**: Set a small fixed default such as three continuation cycles before owner handoff.
- **Evidence**: The owner requires `maxCycles: -1` by default, but rejects repetition without results. Existing global strategy policy defines progress, do-not-repeat conditions, and evidence-based retry conditions.
- **Outcome**: Rejected as the default. Useful cycles remain unlimited; equivalent failed strategies are prohibited immediately unless qualifying new evidence exists.
- **Reason**: Cycle count does not distinguish productive long work from a two-step doom loop.
- **Do Not Repeat**: Do not use an arbitrary finite default as the primary stagnation detector.
- **Evidence-Based Retry Condition**: A finite configured override remains valid when the owner explicitly selects a cost/time budget for a particular environment.

## 2026-08-09 - Store guard strategy and retry state in a temp directory

- **Objective**: Recover audits and avoid repeating strategies after OpenCode restart.
- **Approach**: Write a guard-owned JSON or SQLite state file under a temp or OpenCode data directory.
- **Evidence**: The owner requires strategy history to remain visible in the relevant OpenSpec change or project docs and prohibits a separate temp-state directory. OpenCode v2 child sessions provide retained metadata for technical retry state.
- **Outcome**: Rejected. Store technical in-flight/retry correlation in retained child session metadata and material strategy history in repository-visible files.
- **Reason**: Separate hidden state duplicates evidence and makes strategy decisions harder for main, arbiter, and troubleshooter to discover.
- **Do Not Repeat**: Do not introduce a private guard state database or temp journal.
- **Evidence-Based Retry Condition**: Reconsider only if retained OpenCode metadata cannot survive a proven required restart case and no repository-visible representation can safely close that exact gap.

## 2026-08-09 - Add model-based permission effect arbitration

- **Objective**: Avoid unnecessary main-session permission prompts while preserving effect-aware safety.
- **Approach**: Launch a permission arbiter, inspect scripts/wrappers, and allow once only when the model proves the operation non-protected.
- **Evidence**: Arbitrary wrappers can hide effects, permission classification adds another high-risk lifecycle, and the owner explicitly selected the simpler policy that main permission requests are allowed by default.
- **Outcome**: Rejected. The guard config hook sets merged top-level permission to `allow`; no permission model or command-effect classifier is part of this change.
- **Reason**: Permission classification is not necessary for the accepted completion outcome once the owner selects full main access, and it would materially delay the core guard.
- **Do Not Repeat**: Do not add permission-audit child sessions, command heuristics, or effect-classifier tasks to this change.
- **Evidence-Based Retry Condition**: Reconsider only as a separately approved capability after a reproduced permission-specific incident demonstrates that the selected allow default no longer satisfies the owner.

## 2026-08-09 - Invoke the pinned PTY bridge under Node's TypeScript loader

- **Objective**: Prove the bridge and guard resolve one `opencode-pty` manager and observe the same spawned PTY before running a full disposable OpenCode session.
- **Approach**: Import both TypeScript extension entrypoints with Node 24 `--input-type=module`, initialize the bridge with a minimal client, spawn one short PTY through the bridge tool, and compare the exported manager identity and live id.
- **Evidence**: The process exited non-zero before plugin initialization with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` for `global/node_modules/bun-pty/src/index.ts`. `opencode-pty` resolves its runtime through `bun-pty`, whose package exports TypeScript source under `node_modules`; Node's built-in type stripper intentionally refuses that location.
- **Outcome**: Runner invalid. No PTY was spawned and no candidate runtime behavior was exercised.
- **Reason**: The direct runner used Node while the dependency and OpenCode plugin runtime require Bun-compatible module loading.
- **Do Not Repeat**: Do not retry the shared-manager proof through Node's built-in TypeScript loader or by changing Node type-strip flags.
- **Evidence-Based Retry Condition**: Retry only with the Bun/OpenCode runtime, or after a future pinned `bun-pty` package exposes Node-loadable JavaScript and the compatibility matrix is deliberately changed.

## 2026-08-09 - Assign source-form string allow inside the runtime config hook

- **Objective**: Make main-session permission requests allow by default in the merged runtime without a model or classifier.
- **Approach**: Set `config.permission = "allow"` in the completion guard config hook, mirroring the schema-valid committed source-config shorthand.
- **Evidence**: The first disposable root-session PTY proof reached the shared manager and Waiting state, but the server emitted `schema rejection` because the hook receives normalized runtime `PermissionConfig`; its encoder rejected the source-form string at that boundary. The preserved root proof still showed one completed PTY tool call, Waiting, zero arbiter children, and cleanup, but the product candidate then changed.
- **Outcome**: Corrected before qualification. The hook now merges every supported normalized main permission category to `allow`.
- **Reason**: Source configuration accepts the string shorthand before normalization; plugin hooks operate on the normalized object shape.
- **Do Not Repeat**: Do not assign a string permission shorthand from a plugin config hook.
- **Evidence-Based Retry Condition**: Repeat the disposable root proof only after an offline direct hook invocation turns prior `ask`/`deny` categories into the normalized all-allow object without schema errors. That replay is green with `bash`, `edit`, `webfetch`, `doom_loop`, and `external_directory` all `allow`.

## 2026-08-09 - Read obsolete field names from the v2 agent inventory

- **Objective**: Resolve the configured hidden arbiter route before creating one retained completion-audit child.
- **Approach**: Read agent identity from `name`, model identity from `model.modelID`, and variant from the top-level agent object.
- **Evidence**: The first full PTY lifecycle run proved Waiting and exit delivery, then remained in `audit-retrying` with zero children. Every log row reported `attempt=0` and only `error=Error`. A no-model query against the same disposable server returned the arbiter object keys `id`, `model`, `mode`, `hidden`, with identity `id=session-completion-arbiter` and route fields `model.id`, `model.providerID`, and `model.variant`.
- **Outcome**: Failed before child creation. The live root was deleted, which cancelled the retry chain and cleaned its PTY, and the disposable server was terminated before mutation.
- **Reason**: The controller mixed obsolete/incorrect field names with the actual pinned OpenCode 1.18.15 v2 agent inventory shape. Incrementing attempts only after child creation also prevented backoff growth for route failures, while name-only error diagnostics hid the actionable cause.
- **Do Not Repeat**: Do not infer v2 inventory field names from the legacy config type or debug prose; parse the observed pinned API shape through one production helper.
- **Evidence-Based Retry Condition**: A second live completion attempt is allowed only after the production route parser accepts a preserved v2-shaped arbiter object, rejects a missing/visible route, pre-child failures increment the attempt used by backoff, focused static validation is green, and bounded redacted diagnostics retain the fixed error message and stack/cause shape.

## 2026-08-09 - Assume auto-discovery still supplies the arbiter evidence tool

- **Objective**: Complete the corrected full PTY lifecycle with one bounded arbiter call after deterministic exit delivery.
- **Approach**: Re-run the same root workload after fixing v2 route parsing, while relying on directory auto-discovery to load `global/plugin/session-env.ts` and expose `session_delivery_context`.
- **Evidence**: The corrected run reached one hidden arbiter child on `xai/grok-4.5/high`, but the server never logged a `session_delivery_context` call. Instead the child repeatedly used read/glob/grep/MCP tools to investigate the missing tool and accumulated more than 10,000 server-log lines while remaining busy/auditing. The configured explicit plugin inventory contained only the PTY bridge and completion guard. Cancelling the client-side proof command did not cancel the remote child. On resume, main explicitly aborted child/root, deleted the root (cleaning the PTY), and terminated the disposable server. After the SQLite/runtime and explicit-source correction, no-model `tool.list` proved the context tool was model-visible, but a bounded live child still chose inherited grep/read tools and later hit `Internal error during token generation`; prompt `tools: { session_delivery_context: true }` had not disabled inherited capabilities.
- **Outcome**: Failed after child creation with no structured verdict and no root continuation/pass.
- **Reason**: The guard had no runtime capability check for its evidence tool, the explicit plugin list did not include the plugin that registers it, and the arbiter had no bounded step limit when its mandatory tool was unavailable. After making the source explicit, a no-model `tool.ids` query still omitted the tool; direct Bun import then exposed the deeper loader cause: `session_delivery_context` statically imported Node-only `node:sqlite`, which Bun 1.3.11 does not provide. Finally, OpenCode prompt tool maps are overlays: setting one tool true did not narrow inherited agent tools.
- **Do Not Repeat**: Do not launch a completion child merely because its agent permission mentions `session_delivery_context`; first prove the tool id is registered in the current process. Do not pass a one-key true-only prompt tool overlay when the arbiter must use exactly one evidence tool. Do not treat proof-runner cancellation as remote session cancellation.
- **Evidence-Based Retry Condition**: Another full model run is allowed only after the context reader passes its preserved Node fixture corpus and direct Bun load, a no-model disposable process lists `session_delivery_context` in `tool.ids`, the explicit plugin inventory includes one session-env source with no duplicate cache PTY source, missing-tool preflight fails before child creation, the arbiter has a validated finite per-prompt step bound, the production prompt map disables every current tool id except `session_delivery_context`, and cleanup logic for an interrupted proof explicitly aborts/deletes its remote root without false post-delete guard errors.

## 2026-08-09 - Force the arbiter to one enabled tool through prompt overlay

- **Objective**: Capture one bounded automatic `allow_stop` verdict after proving the context tool is registered and model-visible.
- **Approach**: Query current `tool.ids`, disable every tool id except `session_delivery_context` in the child prompt, cap the agent at six steps, and run a simple completed root without PTY work.
- **Evidence**: No-model replay proved the production map was exact (`read=false`, `grep=false`, `question=false`, `session_delivery_context=true`) and the context reader passed Node and Bun checks. In the live capture, the retained child permissions likewise showed every built-in tool denied and only `session_delivery_context` allowed. The XAI child nevertheless consumed steps 0 through 5 without logging a context-tool call or returning structured output, then emitted `Internal error during token generation`; the guard remained `auditing` until the 180-second runner deadline. Runner `finally` aborted/deleted the root, and the server reported no remaining proof root.
- **Outcome**: Failed with no verdict or root side effect. This is the second materially similar XAI structured-agent failure after evidence-tool availability was corrected.
- **Reason**: Unknown below the OpenCode/provider structured-output boundary. Current evidence shows the issue is no longer tool registration, tool visibility, inherited-tool availability, or an unbounded agent step count. Plausible remaining causes include XAI structured-output/tool-call compatibility or the OpenCode structured-agent loop, but neither is yet proven.
- **Do Not Repeat**: Do not make another XAI completion-child attempt by changing only prompt wording, step count, timeout, retry count, or tool-overlay flags.
- **Evidence-Based Retry Condition**: Retry the live completion path only after one diagnosis-only troubleshooter report selects a materially different mechanism and that mechanism replays the complete preserved parser/continuation/cleanup chain offline. If the diagnosis requires a live observation that cannot be obtained offline, the next attempt must be labeled bounded capability capture rather than proof.

## 2026-08-09 - Diagnose the two-function structured-output boundary

- **Objective**: Explain the repeated XAI child loop without another live/model retry and choose one mechanism-level correction.
- **Approach**: Invoke the diagnosis-only troubleshooter once with the complete route, registration, tool-map, step, provider-error, cleanup, and prohibited-retry evidence.
- **Evidence**: The troubleshooter traced OpenCode 1.18.15 structured output to a synthetic model-visible `StructuredOutput` function with required tool choice. Supplying `session_delivery_context` therefore forced XAI to sequence two functions even when every other registered tool was disabled. The live evidence showed neither function reaching a terminal structured result before provider failure. The same context projection is already exposed as a production read-only function and now loads under both Node and Bun.
- **Outcome**: Selected one distinct correction: capture the redacted context controller-side after deterministic preflight, bind it to the inspected epoch, embed it as audit data, disable every registered tool, and retain the same configured model, structured schema, retained child, retry, parser, CAS, and continuation semantics.
- **Reason**: This removes the unproven two-function provider sequence without changing async authority, evidence semantics, model routing, or owner boundaries.
- **Do Not Repeat**: Do not make another two-function XAI attempt or substitute a sol-only success for the required quality-independent route.
- **Evidence-Based Retry Condition**: One bounded XAI capability capture is allowed only after controller-side capture proves root-ref/schema correlation, redaction/truncation preservation, all-false registered tool mapping, and the complete fake-boundary terminal evaluator chain passes offline with strict OpenSpec/repository validation.

## 2026-08-09 - Capture XAI with only OpenCode StructuredOutput

- **Objective**: Prove the required `quality-independent` XAI route can return one correlated structured `allow_stop` after controller-side evidence acquisition removes every registered model tool.
- **Approach**: Complete the full offline evaluator replay, then run one bounded disposable completed root with all registered prompt tools false and `format: COMPLETION_VERDICT_FORMAT` as the only remaining OpenCode synthetic function.
- **Evidence**: Offline capture/root-ref/redaction/bounds, all-false tool map, allow/continue/malformed-retry/stale/continuation/evidence-reuse, strict validator, and strict OpenSpec checks were green. Live child attempts each made one XAI stream and immediately returned an assistant error; the guard correctly reused one retained child and advanced backoff 2s, 4s, 8s, 16s, 32s, 60s while never resuming root. At the bounded deadline the state was `audit-retrying`, child status `retrying`, zero persisted structured results/tool calls, and runner cleanup deleted the root. Server diagnostics also exposed the submitted `OutputFormatJsonSchema` (including `retryCount: 0`) at the response-schema boundary.
- **Outcome**: Failed with no verdict and no root continuation/pass. The required XAI/OpenCode structured-function route is not live-proven and the completion happy path remains blocked.
- **Reason**: XAI did not produce OpenCode's synthetic `StructuredOutput` call. The exact lower-level reason remains provider/OpenCode compatibility; tool registration and multi-tool sequencing are now excluded. The candidate also discarded the assistant error payload when wrapping it, so the local log retained only the wrapper message.
- **Do Not Repeat**: Do not run another XAI `format: json_schema` proof by changing retry counts, prompt wording, timeout, steps, schema wording, or tool flags.
- **Evidence-Based Retry Condition**: Another live attempt requires an owner-selected protocol/route change, complete offline replay of that distinct mechanism, and preservation of the original assistant error as a bounded redacted cause. A sol-only proof cannot silently replace the specified quality-independent route.

## 2026-08-09 - Owner selects XAI exact-JSON transport

- **Objective**: Resolve the protected model-route/verdict-transport blocker without silently replacing the required quality-independent provider.
- **Approach**: Present the preserved XAI/OpenCode StructuredOutput failures and three real options: XAI with exact locally validated JSON text, OpenAI with OpenCode StructuredOutput, or pause.
- **Evidence**: Owner selected `XAI + JSON`. The existing parser already fail-closes on schema version, enums, required fields, audit/root/revision correlation, and verdict-specific invariants.
- **Outcome**: Authorized replacement of the internal OpenCode `format` transport with one exact JSON text object while retaining `xai/grok-4.5/high`, retained-child retries, parser/CAS checks, and all side-effect rules.
- **Reason**: Preserve provider diversity and the accepted route while removing the repeatedly failing synthetic StructuredOutput function boundary.
- **Do Not Repeat**: Do not reintroduce OpenCode `format: json_schema`, accept Markdown-fenced/prose JSON, extract a JSON substring heuristically, or route quality-independent to another provider without a new owner decision.
- **Evidence-Based Retry Condition**: One bounded XAI capability capture is allowed only after exact whole-text JSON parsing rejects prose/fences/trailing content, valid JSON passes the existing schema/correlation parser, assistant errors preserve their bounded redacted cause, and fake-boundary allow/continue/stale/retry/cleanup replay plus strict validation are green.

## 2026-08-09 - Isolate every XDG directory during provider proof

- **Objective**: Capture the owner-selected exact-JSON XAI verdict without writing the disposable root to the host-default OpenCode database.
- **Approach**: Start the server with isolated `XDG_DATA_HOME`, `XDG_CACHE_HOME`, and `XDG_STATE_HOME`, then run the completed-root capture after the full offline transport replay passed.
- **Evidence**: OpenCode correctly wrote snapshots/database state under the isolated data path, but provider credentials and cached model inventory were absent there. The root reported a missing OpenAI key, while every arbiter attempt failed before provider streaming with `ProviderModelNotFoundError: Model not found: xai/grok-4.5`. The guard remained `audit-retrying`, injected no continuation, and runner cleanup deleted the root. No XAI model call occurred.
- **Outcome**: Invalid environment for provider proof; exact-JSON transport remains untested live.
- **Reason**: OpenCode stores provider authorization/inventory under its XDG-backed local state. Full XDG isolation removed the already authorized credential environment; `OPENCODE_CONFIG_DIR` supplies kit config but not provider credentials.
- **Do Not Repeat**: Do not claim a transport failure from this bundle, copy credentials into disposable storage, or launch an arbiter child before proving its provider/model is currently connected and available.
- **Evidence-Based Retry Condition**: Retry exact-JSON once only after production `provider.list` preflight rejects the preserved disconnected/missing-model shape before child prompt, the host credential-backed no-model inventory confirms XAI connected with `grok-4.5`, root/child cleanup remains explicit, and the run uses the existing credential store without printing or copying secrets.

## 2026-08-09 - Retain the child only inside one audit epoch

- **Objective**: Prove one incomplete revision receives one synthetic continuation and the corrected revision reaches Passed through the same retained arbiter child.
- **Approach**: Run a two-step root that deliberately leaves comparison work for the guard, then require verdict sequence `continue`, `allow_stop`, one continuation, and one child.
- **Evidence**: The root received exactly one synthetic continuation and reached final guard state Passed. The two XAI verdicts completed, but `session.children` contained two completion-audit children. `AuditEpoch.childSessionID` retained a child only across malformed/provider retries within one epoch; `cancelAudit` discarded the epoch after continuation, and the next revision created another child because `RootState` had no retained child owner.
- **Outcome**: Functional continuation succeeded, but task 3.5's one-retained-child pass condition failed. Both children/root were deleted by runner cleanup.
- **Reason**: Child ownership was scoped to an audit attempt rather than the parentless root lifecycle.
- **Do Not Repeat**: Do not claim retained-child semantics from same-epoch retry alone or rerun the continuation workload before cross-epoch root ownership is implemented.
- **Evidence-Based Retry Condition**: Repeat once only after fake-boundary consecutive epochs reuse one validated parent/root child, stale/missing children fail closed or recreate once, child metadata is refreshed for the current audit, and strict validation is green.

## 2026-08-09 - Require only `continue` for autonomous question rejection

- **Objective**: Prove the post-migration autonomous-question branch records guard rejection, not a human answer, and reaches Passed through one retained child.
- **Approach**: Ask a deliberately non-owner arithmetic question, wait for the pending request, then require one guard correction plus final Passed.
- **Evidence**: XAI returned a valid, correlated `allow_stop` verdict on six retained-child attempts. The controller rejected every result with `Pending question audit requires continue, owner_required, or user_paused verdict`, entered exponential retry, and never rejected the open question. Runner cleanup rejected the pending request and deleted root/child.
- **Outcome**: Reproduced accepted-outcome defect; no human reply or synthetic correction was recorded during the candidate run.
- **Reason**: The pending-question controller treated only `continue` as proof of autonomous closure even though `allow_stop` likewise proves no owner boundary and no current unresolved requirement.
- **Do Not Repeat**: Do not retry the same question prompt or require model wording to force `continue`.
- **Evidence-Based Retry Condition**: Repeat once only after both `continue` and `allow_stop` take the identical race-safe guard-reject/correction path offline, while `owner_required`, `user_paused`, and concurrent human-reply precedence remain unchanged.

## 2026-08-09 - Fresh critical SDET challenge after reviewer migration

- **Objective**: Migrate automated fixtures to the hidden completion arbiter and challenge reachable critical completion-guard incidents before validation.
- **Approach**: Fresh test-only `sdet-quality-engineer` child `ses_0187166f1ffeHr3ZUZuJqNNy8a` inspected the current MVP candidate, migrated active tests, added focused guard oracles, and ran the test/validation lanes.
- **Evidence**: Fifteen guard oracles passed; the Russian explicit-stop oracle failed. Main independently reproduced `стоп`, `пауза`, and `пожалуйста остановись` as false against `isExplicitHumanStop`, while English `stop` was true. Cause was the ASCII-only JavaScript `\b` boundary around Cyrillic alternatives.
- **Outcome**: `Action: critical-risks-reported`. Main applied a Unicode-aware boundary correction, restored focused tests to 16/16, and proved a disposable OpenCode root reaches `paused` with zero arbiter children/continuations for `стоп`.
- **Reason**: This was a reachable non-deferrable user-control defect: an explicit owner stop could fail to suppress autonomous completion work.
- **Do Not Repeat**: Do not rerun the pre-fix candidate or broaden stop semantics without a new reproduced control-path defect.
- **Evidence-Based Retry Condition**: A single fresh corrected-candidate SDET attempt is earned because the immediately prior valid attempt found a main-confirmed critical defect, production was corrected, focused tests are green, and current real-boundary interrupt proof is restored.

## 2026-08-09 - First minimized monitor proof uses a broken window evaluator

- **Objective**: Prove one production-launched Windows Terminal monitor starts minimized without changing foreground focus, then closes after a disposable root reaches Passed.
- **Approach**: Create one disposable same-server root in Waiting, start a concurrent Win32 foreground sampler, invoke the production launcher, enumerate windows by the privacy-safe title, transition the root to Passed, and re-enumerate after the close delay.
- **Evidence**: The proof runner reached the post-launch window enumeration, but its PowerShell evaluator failed with `Argument types do not match` while converting a generic `List[object]` through `@($rows) | ConvertTo-Json`. The runner's `finally` deleted the disposable root and reported `{"cleanup":true}`. No structured launch/minimized/focus/close observation was emitted, so window state is unknown. The process then printed a Node/libuv assertion after the primary evaluator failure; no candidate source mutation or remote effect followed.
- **Outcome**: Evidence-only failure after a local visible-window attempt. Product behavior is not classified; the live-attempt gate is blocked for another monitor launch through this proof path.
- **Reason**: The evaluator's collection-to-JSON conversion was invalid in Windows PowerShell 5.1; the failure occurred after the possible physical window launch and before any acceptance observation.
- **Do Not Repeat**: Do not open another monitor with this evaluator or infer minimized/focus behavior from the launch request, cleanup, or absence of a later window.
- **Evidence-Based Retry Condition**: Replay the complete corrected EnumWindows, foreground sampling, JSON normalization, terminal-state evaluation, and cleanup/finalization path without launching a new window. Retry one bounded visible-window proof only after that preserved-path replay is green and emits deterministic empty, single-window, foreground-stability, and terminal-close verdict shapes.

### Retry Evidence

- Corrected Windows PowerShell 5.1 replay replaced the generic list conversion with a regular array wrapped in one JSON object. Without launching a new window it emitted: `emptyShape=true`, `singleShape=true`, foreground row correlated, foreground sampler stable, and synthetic minimized/closed terminal evaluator green.
- The exact unavailable offline observation is the actual production-launched monitor HWND's minimized/focus transition. One bounded evidence-capture retry is unlocked solely to acquire that observation; all JSON normalization and terminal evaluation remain the replayed mechanism.

## 2026-08-09 - Rely on Windows startup style without HWND confirmation

- **Objective**: Acquire the missing real monitor HWND minimized/focus observation with the corrected evaluator.
- **Approach**: Reuse the PowerShell `Start-Process -WindowStyle Minimized` launcher, issue one launch for a disposable Waiting root, sample foreground every 25ms, enumerate the privacy-safe title after 2.2 seconds, transition to Passed, and enumerate again after auto-close.
- **Evidence**: `launchRequests=1`, no launcher warning, foreground remained one unchanged HWND, both corrected window evaluators exited `0`, but `during=[]` and `after=[]`. Root cleanup succeeded. No monitor GET or title-matched HWND was proven.
- **Outcome**: The bounded capture did not prove a monitor window. Current accepted outcome remains broken at the desktop boundary.
- **Reason**: `Start-Process` returned successfully through the Windows Terminal app-execution alias, but startup style alone provided no owning HWND/process confirmation and no actionable failure when the monitor window was absent or immediately exited.
- **Do Not Repeat**: Do not retry `Start-Process -WindowStyle Minimized` without an explicit title-bound HWND handshake and non-zero failure when the window never materializes.
- **Evidence-Based Retry Condition**: A materially different launcher may retry only after it polls for the exact privacy-safe title, applies `SW_SHOWMINNOACTIVE` plus `SWP_NOACTIVATE`, restores the prior foreground if needed, emits non-zero on handshake timeout, and the corrected evaluator remains green offline.

### Retry Evidence

- The replacement hidden launcher now polls `EnumWindows` for the exact privacy-safe title, applies `ShowWindowAsync(SW_SHOWMINNOACTIVE)` and `SetWindowPos(SWP_NOACTIVATE)`, restores only a foreground window actually displaced by the monitor, and exits `3` when the HWND handshake times out.
- Offline execution with launch suppressed and a 1ms deadline returned exactly exit `3`, no PowerShell error, no raw root in argv, and no provider environment keys. Strict repository and OpenSpec validation remain green. This satisfies the retry condition for one real HWND capture through the new mechanism.

## 2026-08-09 - Pass monitor connection data through Windows Terminal environment inheritance

- **Objective**: Prove the title-bound HWND launcher keeps the read-only monitor alive through Waiting and closes it after Passed.
- **Approach**: Launch one monitor with explicit HWND polling/no-activate handling while passing root/server/auth only through the launcher's allowlisted environment and relying on Windows Terminal `--inheritEnvironment` for the Node command.
- **Evidence**: The production launcher requested exactly once, foreground remained one unchanged HWND, corrected evaluators exited `0`, no launcher warning occurred, but no matching window remained at the 3-second Waiting observation and no same-server monitor read was proven. Root cleanup succeeded.
- **Outcome**: Desktop happy path remains red. The launcher may have observed a short-lived title window, but the read-only monitor did not remain observable.
- **Reason**: Exact cause is unknown. Current evidence is consistent with Windows Terminal's singleton/app-execution boundary not forwarding the caller's custom monitor environment, causing the Node console to exit before the evaluator, but the failed window did not preserve stderr to prove that inference.
- **Do Not Repeat**: Do not rely on Windows Terminal environment inheritance for raw monitor connection state or put root/auth values into argv to work around it.
- **Evidence-Based Retry Condition**: Retry only after a one-use local IPC handoff passes root/server/auth in memory, argv carries only an opaque short-lived capability, the handoff closes after one reader or timeout, provider keys remain excluded, and offline producer/consumer/timeout replay is green.

### Retry Evidence

- Real Windows named-pipe offline replay delivered the exact bounded payload once, rejected a second reader, timed out and rejected an unread handoff, used a random opaque 48-hex pipe name, and kept the raw root out of that name.
- Launcher replay requested one window despite duplicate observation. Raw root/password were absent from argv and outer environment; provider keys were excluded; the one-use in-memory payload contained only the required root/local-server/directory/close/auth fields. Strict validation remains green. One live minimized-window attempt through this distinct handoff is unlocked.

## 2026-08-09 - Route the one-use pipe through PowerShell Start-Process arguments

- **Objective**: Keep the named-pipe monitor alive in a minimized Windows Terminal and prove the pipe is consumed.
- **Approach**: Add the opaque pipe name to the `Start-Process -ArgumentList` Windows Terminal command while retaining the title-bound Win32 handshake.
- **Evidence**: `launchRequests=1`, foreground remained unchanged, but the handoff timed out, no title-matched window remained, and root cleanup succeeded. The same production console invoked directly as `node audit-monitor-console.ts --handoff <pipe>` then delivered the handoff once, rendered Waiting and Passed, exited `0`, leaked no raw root, and cleaned the root.
- **Outcome**: Named-pipe producer/consumer is correct; the desktop launch serialization remains red.
- **Reason**: Direct console proof localizes the failed path to PowerShell `Start-Process`/Windows Terminal command serialization rather than the pipe, monitor SDK client, auth, render, or close logic.
- **Do Not Repeat**: Do not route the Node command through `Start-Process -ArgumentList` again.
- **Evidence-Based Retry Condition**: Invoke `wt.exe` directly with an argument array from the plugin, start a separate hidden title watcher before it, keep raw root/auth only in the one-use pipe, and replay both generated argv sets plus watcher timeout offline before another window.

### Retry Evidence

- Direct-launch replay produced watcher first and `wt.exe` only after the watcher's `READY` handshake, with one launch request under duplicate observation. The exact terminal argv contains the privacy-safe title, script path, and opaque pipe only; raw root/auth are absent.
- The real PowerShell Win32 watcher emitted `READY`, completed title-timeout syntax with exit `3`, and produced no error when no terminal was launched. Named-pipe direct console and full evaluator replay remain green. One bounded direct-argv desktop attempt is unlocked.

## 2026-08-09 - Pass a multi-token Node command through Windows Terminal new-tab parsing

- **Objective**: Remove `Start-Process` serialization and run the named-pipe console through direct `wt.exe` argv.
- **Approach**: Start the ready-handshaked Win32 watcher, then invoke `wt.exe -w new new-tab ... node <script> --handoff <pipe>` as separate process arguments.
- **Evidence**: One launch request, no duplicate, unchanged foreground, no matching HWND, no handoff delivery, and successful root cleanup. Windows Terminal package `1.24.11911.0` reports `Status: Ok`; direct named-pipe console remains green.
- **Outcome**: Desktop path remains red before monitor startup.
- **Reason**: Exact lower-level parse behavior is not directly observable. The remaining launch-specific variable is Windows Terminal's parsing of a multi-token child command containing monitor flags such as `--handoff`.
- **Do Not Repeat**: Do not pass the Node monitor command and its flags as independent `new-tab` arguments.
- **Evidence-Based Retry Condition**: Encode one PowerShell bootstrap as a single UTF-16LE `-EncodedCommand` argument, have that bootstrap invoke Node with the opaque pipe, and prove the exact bootstrap consumes the handoff/render/close path directly before another Windows Terminal attempt.

### Retry Evidence

- The exact generated `-EncodedCommand` bootstrap consumed the one-use pipe, rendered Waiting and Passed, exited `0`, emitted no stderr, and leaked no raw root. Neither raw root nor plaintext pipe appears in terminal argv; the bootstrap is one opaque base64 argument after the PowerShell command boundary.
- Watcher readiness/timeout, corrected HWND evaluator, named-pipe single-reader/timeout, repository validation, and cleanup are all green. One bounded Windows Terminal attempt with this encoded command is unlocked.

## 2026-08-09 - Invoke the encoded bootstrap through the `wt.exe` app-execution alias

- **Objective**: Prove a single encoded child command removes Windows Terminal new-tab parsing ambiguity.
- **Approach**: Keep the ready-handshaked title watcher and named pipe, but invoke the encoded PowerShell bootstrap through direct `wt.exe` alias argv.
- **Evidence**: One launch request, zero handoff delivery, zero matching HWND, unchanged foreground, no launcher warning, and successful root cleanup. The exact encoded bootstrap remains green when invoked directly outside Windows Terminal.
- **Outcome**: The app-execution alias launch context is red; child parsing is no longer the active hypothesis.
- **Reason**: The alias/broker accepted the request without actionable error but did not create an observable command process/window in this plugin context.
- **Do Not Repeat**: Do not launch the monitor through the `wt.exe` app-execution alias again.
- **Evidence-Based Retry Condition**: Resolve the installed `Microsoft.WindowsTerminal` package executable through the hidden watcher, validate an absolute `WindowsTerminal.exe` path without opening a window, pass it through the existing readiness handshake, and preserve all named-pipe/evaluator/cleanup gates before one direct-package attempt.

### Retry Evidence

- Hidden watcher resolved the installed package executable to an existing absolute `WindowsTerminal.exe`, emitted only its base64 path after `READY:`, exposed no raw root, and completed the no-window title timeout with exit `3` and no error.
- Launcher replay spawned the watcher first, decoded/validated the absolute basename, then invoked that exact package executable once under duplicate observation. Named-pipe console/evaluator/cleanup and strict validation remain green. One direct-package desktop attempt is unlocked.

## 2026-08-09 - Invoke the installed Windows Terminal package executable directly

- **Objective**: Bypass the app-execution alias/broker and run the proven encoded bootstrap through the installed package executable.
- **Approach**: Resolve and validate the absolute `WindowsTerminal.exe`, start the foreground watcher first, invoke the package executable exactly once, and evaluate handoff/HWND/focus/close for a disposable root.
- **Evidence**: `launchRequests=1`, `handoffDelivered=0`, no matching HWND before or after Passed, one unchanged foreground HWND, no launcher warning, both evaluators exit `0`, root cleanup true, and disposable server exit `0` with no surviving proof session/window. The PTY log buffer was intentionally removed during cleanup, so a later full-buffer read was unavailable.
- **Outcome**: Windows Terminal is not a working command host from this plugin execution context. The accepted monitor window remains unimplemented.
- **Reason**: Unknown below the packaged Windows application activation boundary. Alias, direct package executable, command tokenization, encoded bootstrap, named-pipe consumer, auth, and monitor console have been isolated; only the packaged terminal activation path remains red.
- **Do Not Repeat**: Do not retry Windows Terminal through aliases, package paths, Start-Process, argument rewrites, environment changes, encoded command changes, timeouts, or another equivalent launcher.
- **Evidence-Based Retry Condition**: Retry Windows Terminal only if a future platform/runtime change supplies a supported non-activating command-host API and an offline capability probe distinguishes it from every rejected path. Current work requires an owner-selected alternate shell host or pause.

## 2026-08-09 - Owner selects minimized PowerShell shell host

- **Objective**: Preserve one visible read-only per-root monitor without the unavailable Windows Terminal activation boundary.
- **Approach**: Present the complete Windows Terminal evidence and real options: minimized PowerShell shell, deeper unsupported Windows Terminal integration, or no window. Owner selected `PowerShell shell`.
- **Evidence**: Exact owner selection followed alias, package, handoff, encoded-bootstrap, focus, HWND, and cleanup evidence; no Windows Terminal path produced a monitor command process, while direct PowerShell bootstrap did.
- **Outcome**: Replace the explicit terminal host with a minimized PowerShell console. Keep the same named-pipe, privacy, dedupe, read-only, no-focus, status, and close semantics.
- **Reason**: Remove an unsupported packaged-app dependency without changing the accepted monitor outcome or guard authority.
- **Do Not Repeat**: Do not reintroduce Windows Terminal launch paths into this increment.
- **Evidence-Based Retry Condition**: One PowerShell shell desktop attempt is allowed only after watcher readiness/timeout, encoded bootstrap, named-pipe producer/consumer, direct console render/close, config validation, and argv privacy replay are green.

### Retry Evidence

- PowerShell watcher emitted `READY` and no-window exit `3`; launcher replay spawned hidden watcher first and visible shell only after readiness; raw root/plaintext pipe were absent from shell argv; named-pipe and encoded-bootstrap render/close paths remain green; strict validation accepts `terminal: powershell-shell`.
- This satisfies the owner-selected host retry condition for one bounded minimized shell attempt.

## 2026-08-09 - Rely on parent `spawn(detached)` to allocate a PowerShell console

- **Objective**: Launch the owner-selected shell directly after watcher readiness.
- **Approach**: Spawn a hidden watcher, then use parent `child_process.spawn("powershell.exe", encodedBootstrap, detached=true, windowsHide=false)` for the visible monitor.
- **Evidence**: One launch request, zero handoff delivery, zero title HWND, unchanged foreground, no launcher warning, evaluator exits `0`, and root cleanup true. The exact encoded bootstrap remains green when run directly with captured stdio.
- **Outcome**: Parent detached spawn does not allocate an observable console window in this host context.
- **Reason**: The child process runs without a new visible console under the current Node/OpenCode process creation flags; `windowsHide=false` does not itself force `CREATE_NEW_CONSOLE` here.
- **Do Not Repeat**: Do not use parent detached spawn as the shell-window allocator.
- **Evidence-Based Retry Condition**: Have the hidden PowerShell watcher call `Start-Process powershell.exe -WindowStyle Minimized` with the already proven single base64 `-EncodedCommand`, then perform its title/no-focus handshake; replay exact argument/environment privacy and no-child timeout before one real shell attempt.

### Offline Blocker

- The exact hidden watcher command containing nested `Start-Process powershell.exe` was rejected by the local process boundary before execution with `spawn EPERM`; no shell/window effect occurred. Short PowerShell commands with the same allowlisted environment still execute, localizing the denial to the nested shell-allocation command line.
- Do not retry nested PowerShell allocation. The next distinct built-in allocator is `cmd.exe /c start "" /min powershell.exe -EncodedCommand <base64>` with the watcher returned to observation-only mode; it requires a no-window echo/argv replay before any desktop attempt.

### Retry Evidence

- Observation-only watcher again emitted `READY`, completed its no-window timeout with exit `3`, and produced no error. `cmd.exe` echo replay parsed the exact fixed `start "" /min powershell.exe ... -EncodedCommand <base64>` command with exit `0`.
- Raw root and plaintext pipe are absent from cmd argv/environment; fake ordering proves watcher first and cmd only after readiness; named-pipe, encoded-bootstrap, evaluator, cleanup, and strict validation remain green. One bounded `cmd start /min` shell attempt is unlocked.

## 2026-08-09 - Use cmd `/s` quote processing with `start "" /min`

- **Objective**: Allocate the minimized PowerShell monitor through the built-in cmd `start` command.
- **Approach**: After watcher readiness, invoke `cmd.exe /d /s /c start "" /min powershell.exe ... -EncodedCommand <base64>`.
- **Evidence**: One launch request, zero handoff delivery, zero title HWND, foreground changed across three HWNDs, no launcher warning, evaluators exit `0`, root cleanup true. A second server start on the occupied proof port exited `1` with `ServeError`; the monitor proof used the already-running disposable server. The same command with only the `start "" /min` prefix removed delivered the handoff once, rendered Waiting/Passed, exited `0`, emitted no stderr, leaked no root, and cleaned the root.
- **Outcome**: Shell allocation remains red; cmd/PowerShell/bootstrap are otherwise green.
- **Reason**: `/s` applies special quote processing to the command after `/c` and is the remaining causal difference around `start`'s required empty title token.
- **Do Not Repeat**: Do not use `/s` with the empty-title `start` allocator.
- **Evidence-Based Retry Condition**: Remove `/s`, replay `/d /c` echo plus direct encoded command without a window, preserve watcher/evaluator/privacy/cleanup gates, then allow one minimized capture.

### Retry Evidence

- `/d /c` echo replay parsed the exact command with exit `0`, no stderr, no `/s`, and no raw root/plaintext pipe in argv. Removing only the `start "" /min` prefix from that same `/d /c` command delivered the handoff, rendered Waiting/Passed, exited `0`, emitted no stderr, and cleaned the root.
- Watcher, HWND evaluator, named-pipe, encoded bootstrap, privacy, and strict validation remain green. One `/d /c start /min` capture is unlocked.

## 2026-08-09 - Allocate the PowerShell console with cmd `/d /c start /min`

- **Objective**: Prove the selected shell host from the disposable PTY-hosted OpenCode server.
- **Approach**: Start the observation-only title watcher, then invoke the exact `/d /c start "" /min powershell.exe ... -EncodedCommand <base64>` allocator for one Waiting root.
- **Evidence**: One launch request, zero handoff delivery, zero matching HWND, one unchanged foreground HWND, no launcher warning, evaluator exits `0`, and root cleanup true. The same command without `start /min` remains green. Disposable server exited `0`; its PTY buffer was removed during cleanup, so a later full read was unavailable.
- **Outcome**: No visible shell can be proven from the headless OpenCode server running inside the PTY execution boundary. Current candidate remains `development`.
- **Reason**: The execution environment does not allocate observable desktop console windows for child process requests, even though ordinary foreground HWND inspection is available. This boundary differs from an owner-launched interactive OpenCode TUI process.
- **Do Not Repeat**: Do not retry another desktop allocator, flag, quote, delay, shell, or package path from the disposable PTY-hosted server.
- **Evidence-Based Retry Condition**: The next live attempt must run from the actual owner-launched OpenCode TUI after loading the local config and current source. It is a manual observation gate: one new root completion, taskbar/minimized state, no focus loss, monitor content, and terminal close. Without owner restart/observation, remain development or remove the window increment.

## 2026-08-09 - Assume an owner-launched TUI exposes its SDK server URL over TCP

- **Objective**: Complete the manual desktop gate from the owner-launched OpenCode TUI with one awaited PTY and the opted-in monitor.
- **Approach**: Start one 20-second awaited PowerShell PTY in the current root, let the root idle, and expect the guard and monitor console to query `input.serverUrl` through independently constructed SDK clients.
- **Evidence**: The PTY exited `0` and its synthetic terminal notification reached the root. The current OpenCode process had no TCP listener. Every guard event logged `root identity resolution failed` with `session.get failed` and cause `Unable to connect. Is the computer able to access the url?` for `session_9c4645b7d84e`; no completion-guard metadata, audit child, title-matched monitor HWND, Waiting, or Passed state was produced. The provided plugin input already carries an OpenCode client, but `controller.ts` discarded it and constructed another HTTP client. The external monitor console made the same unproved listener assumption.
- **Outcome**: Final desktop proof failed before deterministic PTY preflight. The candidate remains `development`; minimized state, focus preservation, Waiting rendering, state transition, and Passed auto-close are all unproved by this run.
- **Reason**: A normal owner-launched TUI uses an in-process-capable provided client and does not guarantee a separately reachable HTTP listener. Disposable `opencode serve` proofs masked this operating-envelope mismatch.
- **Do Not Repeat**: Do not retry this root, infer successful auto-close from an absent window, construct another guard client from `input.serverUrl`, or require the monitor child to poll an unproved TUI HTTP endpoint.
- **Evidence-Based Retry Condition**: Use the provided plugin client for guard operations and replace the external console's HTTP dependency with a bounded read-only view of the same persisted runtime metadata. Before another visible-window attempt, prove root/database correlation, read-only access, Waiting-to-Passed rendering and close evaluation offline, keep provider credentials out of IPC/argv/environment, pass focused/strict validation, and require an owner restart because plugin source is loaded only at process start.

## 2026-08-09 - Hide the cmd allocator that must create the visible shell

- **Objective**: Complete the post-restart owner-TUI desktop gate after replacing the unproved HTTP boundary.
- **Approach**: From the restarted interactive TUI, run one 20-second awaited PTY and launch the existing `cmd.exe /d /c start "" /min powershell.exe ...` allocator with `windowsHide: true` while the separate title watcher remains hidden.
- **Evidence**: New TUI run `8b30e247` resolved the root without HTTP errors, observed the correlated PTY, persisted `waiting-async`, and logged one monitor launch request with the bounded environment. PowerShell and Node monitor processes existed, but Win32 `EnumWindows` and process title probes found no `OpenCode Guard` HWND; foreground remained outside the monitor. The exact encoded bootstrap, one-use handoff, read-only database, Passed render, and exit path replayed green when invoked hidden against a disposable database.
- **Outcome**: Guard/client/storage correction works, but the final visible shell boundary remains red. No Waiting or Passed window was observable; the candidate remains `development`.
- **Reason**: The allocator process itself was created with `windowsHide: true`. In the real TUI this propagated a windowless console context: the monitor command ran but had no desktop HWND for the watcher to minimize or expose.
- **Do Not Repeat**: Do not create the visible-shell allocator with `windowsHide: true`, infer success from live monitor processes, or retry this loaded root after source mutation.
- **Evidence-Based Retry Condition**: Keep only the title watcher hidden; create `cmd /c start /min` with `windowsHide: false`; replay exact encoded bootstrap, handoff, read-only storage, terminal evaluator, privacy inventory, focused tests, strict validation, and no-orphan cleanup offline. The only unavailable observation may then be one post-restart owner-TUI HWND capture, explicitly bounded as evidence capture.

## 2026-08-09 - Inspect the root immediately after PTY exit

- **Objective**: Capture minimized/focus/Waiting/Passed/close evidence from the corrected owner-TUI monitor attempt.
- **Approach**: After the awaited PTY exited `0`, immediately issue Win32, database, process, and log probes from the same root before allowing the completion turn to settle.
- **Evidence**: The probes observed persisted Waiting and one auditing child but no title-matched HWND at their sample time. The owner identified that every probe reactivated the root and prevented the intended idle boundary. After main stopped issuing tools and returned one final response, the owner observed the real popup. A subsequent autonomous checklist question was rejected by the guard, so minimized/focus/Waiting/Passed/close details remain unanswered rather than inferred.
- **Outcome**: Real desktop popup allocation is proven by owner observation, but the complete monitor gate remains unproved. Immediate same-root probing is not a valid evaluator for the post-PTY idle transition.
- **Reason**: The proof runner changed the lifecycle state it was trying to observe. Root activity is causally upstream of completion audit and monitor terminal transition.
- **Do Not Repeat**: Do not run tools, questions, process probes, database reads, or log scans from the root between PTY completion and the owner's full Waiting-to-close observation.
- **Evidence-Based Retry Condition**: After the opt-in change is loaded, explicitly `/enable-grind`, start one awaited PTY, return the root to idle, and let the owner observe the full window lifecycle before any follow-up message or tool. Record the owner's observations only after the window closes or the bounded timeout expires.

## 2026-08-09 - Disable races an in-flight PTY fallback

- **Objective**: Prove that default-off and `/disable-grind` prevent every later guard-owned side effect.
- **Approach**: Fresh critical-only SDET held `PtyFallbackScheduler.send()` after its initial lease read, cleared the root lease and set `grindEnabled: false` as `/disable-grind` does, then released root resolution.
- **Evidence**: Main independently reproduced the SDET oracle: focused suite exit `1`, 20 pass/1 fail, with `promptAsync calls=1`. `send()` checked the lease only before awaiting `resolveRoot`, then tested only null/paused before injection. The correction re-reads the lease and requires the exact original lease identity, unconsumed/unsent state, enabled grind, and unpaused root immediately before `promptAsync`. Focused terminal replay is green `21/21`.
- **Outcome**: Confirmed reachable non-deferrable disable race fixed in production and locked by the SDET-authored regression oracle. Product mutation invalidates current-candidate qualification evidence; unaffected preserved raw toggle observations remain diagnostic input.
- **Reason**: Clearing timers and registry state cannot retract a fallback coroutine already running past its first lease lookup. The irreversible boundary needed a post-await correlation check.
- **Do Not Repeat**: Do not inject PTY fallback from a lease snapshot captured before an await, and do not treat timer cancellation alone as closure of an in-flight sender.
- **Evidence-Based Retry Condition**: One corrected-candidate real toggle proof is allowed after the complete focused corpus reaches its terminal green result. A fresh corrected-candidate SDET continuation is allowed only after that proof and must stop on its first precondition-valid no-confirmed-critical result.

## 2026-08-09 - Disable races continuation after final inspection

- **Objective**: Challenge the corrected candidate for another late guard-owned effect after `/disable-grind`.
- **Approach**: A new fresh corrected-candidate SDET forced a valid `continue` verdict through final inspection, then executed `/disable-grind` while `applyVerdict` awaited `status.set` immediately before root `promptAsync`.
- **Evidence**: Main independently reproduced the production controller through Bun: `{"promptAsyncCalls":1,"grindEnabled":false,"state":"running","activeAudit":null,"statusCalls":2}`. The prior PTY fix did not cover controller epoch effects. The correction adds one synchronous `isCurrentAudit` predicate, post-await checks in inspection/verdict/question paths, abort signals on root/question SDK effects, and late-state suppression after SDK awaits. Reproducer is now `promptAsyncCalls=0`, `state=disabled`, `activeAudit=null`; focused suite remains green `21/21`; changed controller/fallback LSP diagnostics are empty.
- **Outcome**: Confirmed continuation TOCTOU fixed across the same accepted audit/question side-effect boundary. Product mutation again invalidates current-candidate Runtime Proof.
- **Reason**: A final inspection before an awaited status/metadata call is not a final CAS. Disable can invalidate the epoch at every await; the irreversible SDK call requires an immediately preceding synchronous epoch/grind check and cancellable request.
- **Do Not Repeat**: Do not invoke root continuation, owner/cycle handoff, or question rejection after an await without revalidating the exact active audit and enabled grind state.
- **Evidence-Based Retry Condition**: One current-candidate persistent-server toggle proof is allowed after both Bun race reproducers and the complete 21-case focused corpus are green. Only then may one new fresh corrected-candidate SDET run.

## 2026-08-09 - Disable races the arbiter call inside runAudit

- **Objective**: Challenge the epoch-safe candidate before the arbiter model call itself.
- **Approach**: A third fresh SDET held `runAudit` during root status persistence after the arbiter child was ensured, executed disable/cancel, then released persistence and observed `session.prompt`.
- **Evidence**: Main reproduced focused exit `1`, 21 pass/1 fail; the Bun oracle reported `promptCalls=1`. `runAudit` checked only at entry and later read `state.auditAbort?.signal` after disable had nulled it. The correction captures the original signal before awaits, revalidates the exact epoch after child resolution and status persistence, passes the captured signal to the model call, rechecks after response, and applies the same post-await closure to retry scheduling. Focused suite is now green `22/22`; controller LSP diagnostics are empty.
- **Outcome**: Confirmed post-disable arbiter-call race fixed and locked by a Bun-backed focused oracle. Product mutation invalidates current Runtime Proof again.
- **Reason**: Entry validation does not survive awaited child/status work, and reading a mutable abort-controller field after cancellation loses the aborted signal.
- **Do Not Repeat**: Do not perform an arbiter call or create a retry timer from an epoch validated only before an await; do not recover the request signal from mutable state after cancel clears it.
- **Evidence-Based Retry Condition**: One current-candidate persistent-server proof is allowed after the 22-case focused corpus and changed-file diagnostics are green. A subsequent fresh SDET is allowed only after that proof.

## 2026-08-09 - Disable races in-flight question correction

- **Objective**: Challenge the arbiter-safe candidate on the non-audit synthetic correction path.
- **Approach**: A fourth fresh SDET held question-correction `promptAsync`, applied disable/cancel while the request was in flight, then released it and observed request cancellation plus local root state.
- **Evidence**: Main independently reproduced focused exit `1`, 22 pass/1 fail: `state=running`, `promptAsyncCalls=1`, `sawAbortSignal=false`. `deliverQuestionCorrection` had neither an owned abort controller nor a post-await enabled check. The correction gives each correction request one root-owned AbortController, passes its signal to `promptAsync`, cancels it on disable/new human/pause/root deletion/dispose, swallows only its own abort, and blocks late state mutation. Focused suite is green `23/23`; controller/types diagnostics are empty.
- **Outcome**: Confirmed question-correction continuation after disable fixed and locked by the Bun-backed focused oracle. Product mutation invalidates current proof again.
- **Reason**: Question correction runs after its audit epoch has already been cancelled, so audit cancellation cannot own its later request. It needed a separate in-flight owner tied to root mode/lifecycle.
- **Do Not Repeat**: Do not launch non-audit synthetic root continuation without an owned abort signal and post-await enabled-state check.
- **Evidence-Based Retry Condition**: One current-candidate persistent-server proof is allowed after the 23-case focused corpus and changed-file diagnostics are green; another fresh SDET only after that proof.

## 2026-08-09 - Stale enabled status persists after disable

- **Objective**: Challenge persisted default-off semantics across process restart.
- **Approach**: A fifth fresh SDET held an enabled root `session.update`, flipped local mode/state to disabled, then released the older update and inspected the final written guard metadata.
- **Evidence**: Main reproduced focused exit `1`, 23 pass/1 fail. The stale payload wrote `state=auditing` and `grindEnabled=true`; `initialRootState` would honor that explicit true after restart. The correction serializes status writes per root and makes each persist converge: after an in-flight response, it compares the written snapshot with current state and immediately writes again until current. Focused suite is green `24/24`; reporter/controller diagnostics are empty.
- **Outcome**: Confirmed persisted re-enable TOCTOU fixed and locked by the focused oracle. Product mutation invalidates current proof again.
- **Reason**: Local cancellation cannot alter an already serialized request body. Correctness requires deterministic write ordering and a final converged snapshot, not mutation of the stale request.
- **Do Not Repeat**: Do not issue concurrent root status writes without per-root ordering, and do not assume an in-flight metadata payload reflects state changed after serialization.
- **Evidence-Based Retry Condition**: One current-candidate persistent-server proof is allowed after the 24-case focused corpus and changed-file diagnostics are green; another fresh SDET only after that proof.

## 2026-08-09 - Disable races monitor launch after handoff

- **Objective**: Challenge disabled mode at the optional desktop sidecar boundary.
- **Approach**: A sixth fresh SDET held `openHandoff`, flipped the mutable root to disabled, released the handoff, and counted monitor launcher process spawns.
- **Evidence**: Main reproduced focused exit `1`, 24 pass/1 fail, `spawnCalls=1` for hidden PowerShell watcher. The correction requires enabled grind at observe entry and immediately after handoff; cancelled pre-spawn ownership closes handoff and releases the per-root launch slot. The READY callback rechecks enabled mode, closes handoff, kills the hidden watcher, and refuses visible shell launch if disable arrived later. Focused suite is green `25/25`.
- **Outcome**: Confirmed post-disable monitor launch fixed and locked by the deterministic launcher oracle. Only the monitor lane is invalidated; command/audit proof run `e27b315f` does not execute monitor code and remains valid for its lane.
- **Reason**: Reporter pre-check and launcher ownership were separated by an awaited handoff; the launcher itself must own cancellation checks at both process boundaries.
- **Do Not Repeat**: Do not spawn watcher or visible shell from mode state validated only before IPC setup.
- **Evidence-Based Retry Condition**: A fresh SDET may use the current green 25-case component corpus plus unaffected command/audit Runtime Proof. Do not repeat a model-backed server run with monitor disabled; it cannot exercise this change. Full desktop monitor proof still requires owner restart and idle observation.

## 2026-08-10 - Preserve owner-TUI idle through terminal monitor close

- **Objective**: Complete the only remaining real desktop monitor observation on current source.
- **Approach**: Owner restarted OpenCode, opened a new root, and ran `/enable-grind`. Main launched exactly one awaited 15-second PowerShell PTY and performed no same-root tools, questions, process checks, database reads, or log probes through terminal observation.
- **Evidence**: PTY `pty_4a4ff0d0` exited `0` without timeout. Main asked the owner to report minimized start, retained OpenCode focus, Waiting, Passed after PTY exit, and automatic close. Owner answered `все хорошо`, confirming all five observations.
- **Outcome**: End-to-end owner-TUI monitor boundary is green; tasks 8.3-8.5 are complete and the monitor increment is MVP.
- **Reason**: Leaving the root idle allowed the guard to observe PTY completion, run its audit, persist terminal state, and let the read-only monitor complete its own lifecycle without evaluator interference.
- **Do Not Repeat**: Do not rerun the live desktop attempt without a later monitor production mutation or invalidating environment change.
- **Evidence-Based Retry Condition**: None for the current monitor candidate. RC2 remains gated only by complete green repository validation.

## 2026-08-10 - Same-epoch retries amplify the audit prompt past the provider limit

- **Objective**: Restore grind completion/question adjudication after repeated schema-invalid arbiter verdicts made the retained child exceed the configured model context limit.
- **Approach**: Preserve the failed child and logs, compare every persisted user-part size, trace retry construction through `runAudit`, then replay the corrected controller against one 181,000-character evidence snapshot with an invalid first verdict and valid second verdict.
- **Evidence**: Production logs show attempts 1-8 rejected with `An owner_required verdict requires ownerBoundary`, followed by attempt 9 failing because the 500,000-token model received 510,529 tokens. The retained child contains nine identical 181,969-character audit user parts and reports 455,893 input plus 1,670,528 cache-read tokens. The pre-correction controller rebuilt the complete request on every same-child retry and supplied no parser feedback. The candidate sends the complete snapshot once, then a bounded correlated retry with the sanitized parser error. Actual-controller offline replay reached `passed` in two prompts with `firstChars=181924`, `retryChars=548`, `retryHasEvidence=false`, `retryHasFeedback=true`, and `sameChild=true`.
- **Outcome**: Confirmed product defect corrected at the prompt-construction boundary. Fresh test-only SDET added one controller oracle and returned `no-critical-risk`; focused guard validation is green `26/26`. One bounded real arbiter-model transport check is unlocked after the complete terminal offline replay.
- **Reason**: Exponential delay bounded concurrency but not cumulative prompt size. Repeating the immutable 181,969-character evidence could not correct a deterministic schema error and consumed the retained child's context until provider rejection; omission of the parser error also encouraged the same invalid verdict to recur.
- **Do Not Repeat**: Do not resend `completionEvidence` within the same audit epoch, retry malformed output without bounded validation feedback, or repeat the failed live child/provider chain.
- **Evidence-Based Retry Condition**: Before any real model retry, the current candidate must keep the original full request, send a sub-2,000-character same-child correction without `completionEvidence`, include the sanitized validation reason, preserve correlation, and reach a terminal valid verdict through the complete offline controller path. This condition is now satisfied for one disposable grind-disabled synthetic transport check; another live attempt requires new causal evidence.

## 2026-08-10 - Live bounded-retry evaluator omitted the rejected verdict shape

- **Objective**: Check the candidate's bounded correction against the configured real arbiter model without repeating the user's failed high-context chain.
- **Approach**: In one disposable grind-disabled session, send a small original audit request and then the production `buildArbiterRetryRequest`; parse the second persisted assistant text with the production verdict parser and delete the session in `finally`.
- **Evidence**: Both model calls completed and the runner reached the second persisted response, but `parseCompletionVerdictText` rejected it with `Invalid completion verdict field: verdict`. The runner then deleted session `ses_014e4d23affeFPA28P4O8YZOTk`. Its evaluator preserved the exception but not the rejected field shape, so the exact model value is unavailable from the deleted bundle. Production was not mutated. A corrected privacy-safe evaluator now records only text length, sorted top-level keys, schema version, bounded verdict value, owner-boundary kind, and correlation booleans; offline replay with a secret-bearing malformed fixture exited `0`, retained `verdict=invalid-fixture`, and did not emit the secret value.
- **Outcome**: Evidence-only live failure. Product Runtime Proof remains the green terminal controller replay, but the real-model lane is blocked until one bounded capture-only run acquires the missing structural observation. The failed check is not proof and does not authorize another proof attempt.
- **Reason**: The model returned a JSON-shaped but schema-invalid verdict, while the proof evaluator deleted the disposable session before preserving a privacy-safe structural diagnostic. The missing observation cannot be reconstructed from provider logs.
- **Do Not Repeat**: Do not run another live proof, change prompt wording speculatively, preserve raw completion evidence/model text, or rely on an exception-only evaluator.
- **Evidence-Based Retry Condition**: Exactly one capture-only run is allowed with the replayed privacy-safe evaluator and mandatory session cleanup. It may acquire only the missing verdict/schema/correlation shape and cannot claim product proof. Any later live attempt requires a causal production correction plus complete offline terminal replay of the newly observed failure.

## 2026-08-10 - CLI live runner silently used primary build instead of the hidden arbiter

- **Objective**: Acquire the missing privacy-safe shape of the schema-invalid live response and classify whether it came from the candidate arbiter route.
- **Approach**: Replay the secret-safe structural evaluator offline, then run the one authorized capture-only sequence and correlate its session with server stream logs.
- **Evidence**: Capture returned schema version 1 with correct audit/root/revision correlation but `verdict=stop` and legacy-shaped keys `continuationRequired`, `openTodos`, `pause`, and `unresolvedTodos`. Server logs for both original and capture sessions show `agent=build mode=primary` on both model streams despite CLI `opencode run --agent session-completion-arbiter`. No `session-completion-arbiter` stream occurred. Both disposable sessions were deleted. Current fresh config still resolves the completion guard from this repository and lists the intended hidden arbiter definition.
- **Outcome**: The two CLI checks are invalid-route evidence, not product failures or product proof. The missing response shape is now explained by execution under primary build instructions. Live gate remains blocked for that CLI path; no production mutation is authorized by these results.
- **Reason**: The CLI runner cannot be trusted to select a hidden subagent by name and silently fell back to the primary agent. Its `stop` schema came from the wrong instruction context.
- **Do Not Repeat**: Do not use `opencode run --agent` to validate hidden-agent transport, do not reinterpret build-agent output as an arbiter defect, and do not make another model call before route identity is proven without a model.
- **Evidence-Based Retry Condition**: A materially different SDK runner may unlock one bounded synthetic transport check only after a fresh local server reports the intended hidden agent/model, creates and reads back a session with `agent=session-completion-arbiter` and `model=xai/grok-4.5/high`, performs zero model calls during that preflight, and deletes the session. The live check must then use the same `client.session.prompt` shape as the production controller and preserve privacy-safe output plus cleanup.

## 2026-08-10 - Project-native SDK runner proves bounded retry on the hidden arbiter

- **Objective**: Prove the corrected retry through the actual hidden-agent SDK route and preserve the boundary knowledge as reusable project tooling.
- **Approach**: Add an inventoried `tools/proofs` runner plus shared OpenCode proof-client API, launch one disposable local OpenCode server, run a zero-model route/readback preflight, then execute one authorized original-request/bounded-retry sequence through `client.session.prompt` with every model tool disabled.
- **Evidence**: Preflight emitted `agent=session-completion-arbiter`, `hidden=true`, `model=xai/grok-4.5/high`, `childParent=true`, and `modelCalls=0`. Live execution exited `0` and emitted `firstChars=1248`, `retryChars=510`, `retryHasEvidence=false`, `validCorrelation=true`, and `verdict=allow_stop`. The server was terminated, PTY state was cleaned, and a database count for proof-titled sessions returned `0`. Reusable sources are `tools/proofs/session-completion-guard-retry.ts`, `tools/proofs/lib/opencode-proof-client.ts`, and the discoverable `tools/proofs/README.md` inventory.
- **Outcome**: Current production correction has green local controller terminal replay and green configured-provider hidden-agent transport proof. The failed CLI evidence remains attributed to the invalid build-agent route and is not mixed with this candidate proof.
- **Reason**: The SDK route preserves the production controller's explicit hidden agent, model, variant, all-tools-disabled map, retained child, and prompt shape; the bounded retry supplies parser feedback without re-embedding immutable completion evidence.
- **Do Not Repeat**: Do not recreate this runner in temp, use CLI hidden-agent fallback, or rerun the live lane without a dependent product/runner/environment mutation or new failure evidence.
- **Evidence-Based Retry Condition**: A later retry requires a dependent mutation or a newly observed failure. Run the inventoried no-model preflight first, preserve exact invocation/result, and follow the live-attempt gate before `--mode live`.

## 2026-08-10 - Structured owner boundary was rejected as if it were missing

- **Objective**: Stop a pending protected owner question from repeatedly invoking the arbiter while the interactive question remains unanswered.
- **Approach**: Preserve the new root/child state and inspect only privacy-safe verdict structure and parser diagnostics before any additional model call.
- **Evidence**: Root `ses_014c91f01ffenx69e3cFXmp3Z9` opened one owner-only question. Retained child `ses_014a2ce17ffeU77uvXtoXttc84` produced three correlated schema-version-1 `owner_required` verdicts. Every `ownerBoundary` was an object with exactly `decision:string`, `reason:string`, and `evidenceRefs:string[]`; the parser nevertheless required a string and retried with 2,000 ms then 4,000 ms backoff. The child reached 206,915 input and 228,480 cache-read tokens while the root question stayed open.
- **Outcome**: Confirmed internal verdict-schema mismatch. The canonical field is now the observed structured object; a valid owner-required question must transition terminally to Owner Required and remain open for the human response.
- **Reason**: The agent example showed only `ownerBoundary: null`, the design left its data shape unspecified, and the parser privately assumed a string. Retry feedback could not correct an ambiguous contract that the model had already satisfied semantically.
- **Do Not Repeat**: Do not retry a schema-valid structured owner boundary as missing, accept unvalidated arbitrary objects, or auto-answer/reject an owner-only question.
- **Evidence-Based Retry Condition**: Before another live model call, replay the preserved `{decision,reason,evidenceRefs}` shape through the production parser and actual question-verdict path to terminal Owner Required with zero question reject/root continuation calls. Then validate the exact hidden-agent schema route without reusing the active user child.

## 2026-08-10 - Structured owner question terminates without reject or continuation

- **Objective**: Prove the schema correction against the exact observed owner-boundary shape and preserve a reusable terminal question-path runner.
- **Approach**: Canonicalize `ownerBoundary` as `{decision,reason,evidenceRefs}`, reject that field on non-owner verdicts, update the hidden-agent/spec contract, and replay a privacy-safe equivalent of the preserved real response through the production parser and `applyVerdict` question path.
- **Evidence**: `npm run proof:guard-question` exited `0` with `finalState=owner-required`, `questionState=owner-required`, non-empty decision, `questionRejectCalls=0`, and `rootPromptCalls=0`. The runner is maintained at `tools/proofs/session-completion-guard-question.ts` and inventoried in `tools/proofs/README.md`. Fresh SDET added the canonical/legacy/invalid/non-owner protocol oracle and returned `no-critical-risk`; focused guard tests are green `27/27`. Strict validation reports zero warnings and OpenSpec validation is green `10/10`.
- **Outcome**: Current candidate accepts the configured arbiter's already-observed structured response and reaches the required terminal owner-question state without another live model attempt. The interactive question remains for the human to answer; retry toasts stop after restart loads the candidate.
- **Reason**: Parser, TypeScript type, hidden-agent instructions, design, spec, proof, and regression oracle now share one exact object contract rather than relying on an unstated string assumption.
- **Do Not Repeat**: Do not accept legacy string boundaries, attach an owner boundary to autonomous verdicts, reject/answer an owner-only question, or rebuild this proof in temp.
- **Evidence-Based Retry Condition**: No additional live arbiter call is required for this correction because the preserved configured-model output already matches the accepted candidate shape. A later live retry requires a dependent mutation or a newly observed distinct failure after restart.
