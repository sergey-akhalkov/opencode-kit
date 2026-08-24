# Strategy History

## 2026-08-20 - Replace the workstation Node runtime with Bun

- **Objective:** Reduce memory by using one JavaScript runtime for the workstation controller and OpenCode.
- **Approach:** Consider running the protected TypeScript controller/supervisor under Bun because the installed OpenCode package binary is Bun-compiled.
- **Evidence:** Live measurement with two clients found the persistent Node supervisor at about 18 MiB working set / 39 MiB private bytes, while the Graphify duplicates were about 465 MiB private bytes each, each retained launcher chain was about 105 MiB private bytes, and the Bun-compiled OpenCode server/clients consumed hundreds of MiB to more than 1 GiB each. Node also remains required by Codebase Memory wrappers and TypeScript/YAML language servers.
- **Outcome:** Rejected for this increment.
- **Reason:** Runtime replacement has a small possible gain, does not remove Node from the host, and changes the privileged process-identity/restart boundary without addressing the measured duplication.
- **Do-Not-Repeat Condition:** Do not prioritize Node-to-Bun controller conversion while the current supervisor remains a small fraction of the attributable resource cost and the sharing/lifecycle defects remain.
- **Evidence-Based Retry Condition:** Reconsider only after shared Graphify and launcher-chain closure are current and green, a disposable Node-versus-Bun supervisor comparison shows a material additional benefit, and all protected identity/Restart/Stop semantics can be re-proven.

## 2026-08-20 - Share every code-intelligence process behind one endpoint

- **Objective:** Eliminate every per-project Serena, Graphify, Codebase Memory, and LSP process.
- **Approach:** Consider converting all local tools to one remote multi-project service.
- **Evidence:** Installed Serena source retains one singleton `SerenaAgent` across non-stdio connections; project activation shuts down the previous project's language backend. Serena ProjectServer supports multiple cached projects but enforces read-only tool execution. OpenCode/Serena LSP servers use workspace-initialized stdio connections with no supported shared-client broker. Codebase Memory already exposes one internal daemon behind small project frontends.
- **Outcome:** Rejected in favor of a hybrid sharing boundary.
- **Reason:** A shared transport does not isolate process-wide active-project, write-tool, or LSP workspace state and could route edits/diagnostics to the wrong repository.
- **Do-Not-Repeat Condition:** Do not pool ordinary Serena agents or LSP stdio processes merely because HTTP or a proxy can carry multiple clients.
- **Evidence-Based Retry Condition:** Retry only when the upstream service exposes a documented concurrent multi-project contract with explicit request-scoped project authority for the full required tool set, including write/refactoring behavior where applicable.

## 2026-08-20 - Use Graphify's native shared Streamable HTTP service

- **Objective:** Remove duplicate heavy graph loads while preserving Graphify for every project.
- **Approach:** Run one loopback stateless Graphify HTTP service and configure every OpenCode project instance to use it as the same remote MCP.
- **Evidence:** Installed `graphify.serve` supports stdio and Streamable HTTP, API-key authentication, stateless operation, one pinned default graph, a bounded LRU for explicit `project_path` graphs, and states that one process can host the graph for multiple clients. Current local MCP instances use the same fixed graph path and each committed about 465 MiB private bytes.
- **Outcome:** Selected for proposal, specs, design, and tasks.
- **Reason:** It uses an upstream-supported multi-client contract at the largest measured duplicate resource boundary and preserves the tool inventory.
- **Do-Not-Repeat Condition:** Do not add a generic MCP gateway or another Graphify implementation while the native HTTP service satisfies auth, routing, lifecycle, and measurement requirements.
- **Evidence-Based Retry Condition:** Revisit the transport only if disposable or installed proof shows OpenCode remote-MCP incompatibility, wrong graph/tool behavior, unacceptable readiness regression, or a Graphify HTTP correctness defect that cannot be corrected within the selected native boundary.

## 2026-08-20 - Keep implicit project cwd for shared Graphify PR tools

- **Objective:** Preserve existing Graphify calls without adding a routing rule.
- **Approach:** Start the singleton in one working directory and let omitted `repo` continue using Graphify's process cwd.
- **Evidence:** Current per-project local MCP processes start with `cwd: "."`, so omitted repo context differs by OpenCode project. Installed Graphify PR handlers detect defaults from process cwd, while one shared process has only one cwd. Graph-only tools can use the fixed default graph or explicit `project_path`, but OpenCode does not inject the caller directory into arbitrary remote MCP arguments.
- **Outcome:** Rejected; selected a narrow pre-call guard requiring explicit `repo` only for repo-context tools.
- **Reason:** Keeping implicit cwd would silently target whichever repository owns the singleton process rather than the calling project.
- **Do-Not-Repeat Condition:** Do not select a shared service cwd as authority for project-relative Graphify operations.
- **Evidence-Based Retry Condition:** Remove the guard only if Graphify or OpenCode adds a verified request-scoped caller-directory field that the handler consumes atomically, with concurrent two-project proof.

## 2026-08-20 - Add a Codebase Memory HTTP relay

- **Objective:** Remove the duplicated Codebase Memory npm/native stdio frontends.
- **Approach:** Consider placing one MCP HTTP relay in front of one Codebase Memory frontend.
- **Evidence:** Live process inspection found one `--cbm-daemon-internal` serving both active projects; only small Node/native frontends were duplicated. The installed CLI exposes stdio MCP and a shared internal daemon but no native remote MCP endpoint.
- **Outcome:** Rejected for this increment.
- **Reason:** A new relay adds a resident dependency, protocol/lifecycle owner, and failure domain for a small remaining cost while the heavy indexed state is already shared.
- **Do-Not-Repeat Condition:** Do not build a generic or Codebase-Memory-specific broker solely to remove the current small frontends.
- **Evidence-Based Retry Condition:** Reconsider if three/four-client evidence shows frontend cost is material after the selected changes or Codebase Memory adds a supported authenticated remote MCP transport.

## 2026-08-20 - Override Graphify with an inline config or plugin hook

- **Objective:** Switch the managed server from local to remote Graphify without editing the machine-local config source.
- **Approach:** Consider an `OPENCODE_CONFIG`/inline deep-merge overlay or a plugin `config` hook that replaces `mcp.graphify-global` at runtime.
- **Evidence:** Current OpenCode source deep-merges config objects, so an overlay cannot reliably remove the old local `command` while preserving the same MCP name. Config variables are substituted before external plugin config hooks run; a plugin-injected credential/header can therefore remain as resolved inspectable runtime data. A second MCP name would change tool prefixes and leave the local entry configured unless separately disabled.
- **Outcome:** Rejected in favor of one minimal managed JSON/JSONC source edit with exact backup and rollback.
- **Reason:** The overlay/hook strategies weaken schema clarity, tool-name compatibility, or credential observability and do not deterministically remove the duplicate local process.
- **Do-Not-Repeat Condition:** Do not rely on deep merge to delete discriminated local MCP fields and do not inject a raw Graphify key from a post-substitution plugin hook.
- **Evidence-Based Retry Condition:** Reconsider only if OpenCode gains an explicit replace/delete merge operation or a secret-reference API that remains unresolved outside the remote transport and is proven through current runtime diagnostics.

## 2026-08-20 - Remove launch waiting after UAC

- **Objective:** Stop hidden `wscript -> node -> powershell` launcher chains from living as long as Alacritty.
- **Approach:** Consider removing PowerShell `Start-Process -Wait` and returning success immediately after starting the elevated controller.
- **Evidence:** Each live project left about 179 MiB working set / 105 MiB private bytes in the hidden chain. The existing VBS invoker shows its required diagnostics popup only when the controller returns non-zero; a no-wait path would report success before post-elevation validation. The elevated controller itself exits after spawning detached Alacritty, but PowerShell `-Wait` follows the descendant tree.
- **Outcome:** Naive no-wait rejected; direct elevated-process waiting selected.
- **Reason:** Resource cleanup must not erase post-UAC exit status and failure visibility.
- **Do-Not-Repeat Condition:** Do not remove synchronous launch result propagation or apply a global no-wait change to Start/Restart/Stop/install/rollback.
- **Evidence-Based Retry Condition:** Retry only the selected direct-process mechanism: start with `-PassThru`, wait via that process object's `WaitForExit()`, preserve its exit code, and prove both actual success cleanup and post-elevation failure popup.

## 2026-08-20 - Reconcile the Restart candidate and capture the local-MCP baseline

- **Objective:** Close the overlapping-writer prerequisite and preserve an equivalent pre-mutation resource oracle.
- **Approach:** Treat the current targeted-kill/tray diff from `fix-workstation-restart-reliability` as the integration base, verify session evidence contains no live mutation-capable child, then run two proof-owned Graphify stdio clients sequentially against the same configured graph and replay the evaluator offline.
- **Evidence:** `evidence-task-1-1-baseline-r1/evaluation.json` passed every behavior/cleanup check. One service tree measured median 468.548 MiB private and 13,144 ms ready; two measured 936.743 MiB and 18,100 ms for the second. Tool inventories and representative result digests matched. `evidence-task-1-1-baseline-replay-r1/evaluation.json` reproduced the verdict with zero live calls. The active Restart history's selected targeted-kill strategy remains present in the working tree, and session delivery evidence lists no live writer.
- **Outcome:** Task 1.1 complete; production mutation is unblocked on the reconciled working tree.
- **Reason:** The baseline now proves the causal duplicate cost and the overlapping change has a terminal, attributable source state rather than unknown writer liveness.
- **Do-Not-Repeat Condition:** Do not overwrite the targeted-kill/tray diff, rerun the live baseline without a candidate-relevant reason, or terminate owner clients to obtain cleaner numbers.
- **Evidence-Based Retry Condition:** Recapture only if the installed Graphify binary/graph/config or benchmark workload changes before candidate comparison, or if later evaluator evidence proves the current raw bundle incomplete.

## 2026-08-20 - Establish the effect-free shared-Graphify contract

- **Objective:** Make the shared Graphify configuration, identity, auth-probe, rollback, and repository-routing contract executable before any workstation or endpoint mutation.
- **Approach:** Add one cohesive Windows shared-tool module with schema-2 machine configuration, exact local-entry recognition, one-range `jsonc-parser` planning, byte/ACL identities, protected projections, listener/process authorization, MCP probes, and cause-preserving redaction. Compose the exact three-tool explicit-`repo` guard through the already loaded `session-env` plugin and exercise the complete boundary only against temp JSON/JSONC and an isolated installed OpenCode schema loader.
- **Evidence:** `evidence-task-2-1-contract-r3/evaluation.json` passed all 13 checks: real preflight ready on free `4097`; one bounded edit with unrelated prefix/suffix preserved; installed OpenCode accepted the managed remote schema; exact byte rollback and ACL identity matched; missing/wrong/duplicate inputs and synthetic listener collision failed closed; repository guard and nested-cause redaction passed; source config hash remained unchanged; no endpoint was contacted; cleanup completed. `evidence-task-2-1-contract-replay-r3/evaluation.json` reproduced the verdict with `liveCalls: 0`. `npm.cmd run test:focused:session-plugin` passed 17 tests, `npm.cmd run validate:strict` reported zero warnings, `npm.cmd run openspec:validate` passed 17 items, and `openspec.cmd validate optimize-shared-opencode-runtime-resources --strict` passed.
- **Outcome:** Task 2.1 complete; task 2.2 disposable Graphify HTTP and OpenCode remote-MCP integration is unblocked.
- **Reason:** Configuration and credential-bearing probes now have one validated owner and a replayable fail-closed contract without modifying the active global config, ProgramData runtime, task, listeners, credentials, or target repositories.
- **Do-Not-Repeat Condition:** Do not duplicate Graphify policy in the workstation controller, send a credential before positive process/listener identity, deep-merge over the local MCP entry, or use shared service cwd as repository authority.
- **Evidence-Based Retry Condition:** Revise and recapture this contract only if the machine schema, Graphify executable/module/graph, OpenCode remote-MCP schema, guarded repository-tool inventory, or minimal-edit/rollback semantics change.

## 2026-08-20 - Prove disposable shared Graphify and OpenCode remote MCP

- **Objective:** Prove one authenticated stateless Graphify process can serve two exact OpenCode project directories through the same remote MCP without a provider/model or PR call.
- **Approach:** Start the configured fixed-graph HTTP service on `127.0.0.1:4097`, require positive process/listener identity before credential-bearing requests, start one installed OpenCode server from an isolated config containing only the same-named remote MCP, connect two directory-scoped SDK clients, and compare inventory/result digests with the preserved local-MCP baseline. Exercise missing and explicit `repo` through the production guard before graph calls and capture attributed process/listener/secret/cleanup facts.
- **Evidence:** `evidence-task-2-2-integration-r11/evaluation.json` passed all 14 checks and `evidence-task-2-2-integration-replay-r11/evaluation.json` reproduced them with `liveCalls: 0`. Unauthenticated MCP returned `401`; authenticated initialize returned `200`; the exact ten-tool inventory matched baseline; project A/B exact worktrees reported connected under `graphify-global` in 163 ms and 850 ms; both `graph_stats` results matched baseline digest `51ce8dbc...`; one Graphify service tree and one OpenCode listener existed; the OpenCode tree had zero local Graphify descendants; provider and PR calls were zero; credential scans and cleanup passed.
- **Failure Chain:** r1’s 60-second Graphify timeout was a runner defect: a no-listener `_build_server` probe took 53,762 ms and CIM polling added contention. Lightweight TCP readiness plus one identity check corrected it. r2/r3 exposed cold file-plugin stalls; no-plugin diagnostic r2 and object-form guard diagnostic r4 plus their replays isolated and proved the loader shape. r4/r5 showed `/experimental/tool/ids` excludes MCP IDs despite connected status; r6’s inline proof provider reintroduced cold package resolution; r7-r9 confirmed provider/tool-schema and combined file-plugin paths were invalid proof dependencies. The final runner composes separately proven guard loading with the no-plugin remote-MCP lane rather than masking those stalls with larger timeouts.
- **Outcome:** Task 2.2 complete; task 3.1 source controller integration is unblocked. `Development-Stage` remains `development` because ProgramData and the actual workstation entry point are unchanged.
- **Reason:** The first real installed-binary boundary now proves Graphify HTTP/auth/stateless behavior, OpenCode per-directory remote connection, fixed-graph equivalence, process deduplication, failure-safe repository policy ordering, secret containment, and complete proof-owned cleanup.
- **Known Limitation:** Provider-free OpenCode `/experimental/tool/ids` omits MCP tools and `/experimental/tool` requires provider resolution. Prefix compatibility is therefore composed from the unchanged connected MCP name `graphify-global`, exact baseline server inventory, and OpenCode's existing same-name namespace contract; the actual installed client-visible prefixed inventory remains an explicit task 3.2 proof.
- **Do-Not-Repeat Condition:** Do not poll Graphify readiness with repeated CIM processes, use bare-function plugins, add a proof provider solely to enumerate tools, combine cold file-plugin loading with the remote-MCP lane, or treat OpenCode project metadata ID `global` as directory identity for unborn disposable repositories.
- **Evidence-Based Retry Condition:** Repeat the disposable integration only after a relevant Graphify/OpenCode/module/config/runner change, or when a provider-free installed API exposes MCP-prefixed tool IDs and can replace the current composed prefix oracle without a model request.

## 2026-08-20 - Integrate sibling lifecycle and direct launch handoff

- **Objective:** Make the reconciled workstation controller own one authenticated Graphify sibling and close launch-only UAC wrappers without weakening synchronous Start/Stop/Restart.
- **Approach:** Install/hash the shared module beside the controller; introduce manifest schema 2, protected Graphify credential and exact config backup/edit identity; start/validate Graphify before OpenCode; record both roots/listeners in one state; keep OpenCode alive while marking post-ready Graphify exit `degraded`; validate/stop both identity sets; restore config on rollback; drive tray state from recorded identities; and use direct `Process.WaitForExit()` only for launch elevation.
- **Evidence:** `evidence-task-3-1-contract-r5` and zero-live replay pass atomic JSONC apply/readback/exact ACL+byte restore, schema loading, negative collisions, redaction, and cleanup. `evidence-task-3-1-handoff-r2` and replay pass direct-wrapper release while a detached child remains, failure exit 23 propagation, non-launch `-Wait`, popup preservation, and cleanup. Source `--help`, preflight, and schema1 installed Status exit 0; preflight reports both endpoints, module/config/credential/backup projections, and no 4097 listener. Focused session plugin tests pass 17/17.
- **Review Corrections:** Before installation, fixed case-insensitive cross-module SHA comparison, 4097-aware Stop, early listener capture, retry-safe config backup cleanup, complete repair catch restoration, explicit Graphify degraded diagnostics, one actual state path, state/identity-based tray color, and post-install preflight readback.
- **Outcome:** Task 3.1 complete; protected stopped repair and actual one-client proof are unblocked. `Development-Stage` remains `development` until task 3.2.
- **Do-Not-Repeat Condition:** Do not use `Start-Process -Wait` for project launch, raw port-only tray health, repeated CIM readiness polling, tree-kill, swallowed config restoration, or case-sensitive comparison across controller/module hash formats.
- **Evidence-Based Retry Condition:** Reopen 3.1 if installed task 3.2 exposes a source/manifest/config/lifecycle mismatch or if direct launch leaves a controller/elevation wrapper.

## 2026-08-21 - Install schema2 candidate and prove one-client MVP

- **Objective:** Upgrade the active schema1 workstation through one detached stopped transaction while the invoking session is attached to that server.
- **Approach:** Launch a detached Node writer that captures before-state, runs exact managed `stop → install --config → installed start`, then captures manifest/config/status/secret facts and performs recovery Start on failure.
- **Evidence:** `evidence-task-3-2-install-r1/evaluation.json` passes Stop, stopped repair, Start, schema2, installed controller/module hashes, composite OpenCode+Graphify health, both listeners, managed config hash, env-reference-only config, and secret scan. Installed read-only Status reports OpenCode 200 healthy, Graphify unauthenticated 401/authenticated 200 with all ten tools, one 4096 and one 4097 listener, matching source hashes, and rollback dry-run eligible. The resumed exact `opencode-kit` session successfully invokes Graphify, Codebase Memory, and Serena read-only tools after repair.
- **Outcome:** Task 3.2 complete and `Development-Stage: MVP`. The managed runtime is healthy and retained.
- **Owner Envelope Update:** Subsequent experiments must not Stop/Restart/rollback the current server without explicit permission. Destructive/degraded scenarios use proof-owned OpenCode/Graphify instances and temp config; current candidate receives read-only Status/inventory only.
- **Do-Not-Repeat Condition:** Do not run managed Stop/Restart from the attached session or use the current server for failure injection.
- **Evidence-Based Retry Condition:** Reopen 3.2 only if read-only installed identity/health drifts or a later source correction requires a separately authorized stopped repair.

## 2026-08-21 - Prove two-project resource result without current-server mutation

- **Objective:** Prove the hybrid two-project ownership/resource benefit while honoring the owner instruction not to restart or inject failures into the current server.
- **Approach:** Reuse two green equivalent proof-owned OpenCode/Graphify captures (`r10`, `r11`) and evaluate their complete process rows offline against the preserved task-1.1 duplicate-local baseline. Confirm current installed capabilities read-only through Graphify, Codebase Memory, Serena, Status, and rollback dry-run.
- **Evidence:** `evidence-task-4-1-resource-eval-r1/evaluation.json` passes two equivalent captures, readiness allowance 21,720 ms, and the 35% resource gate. Candidate median Graphify private bytes improve by 49.86%. Both captures have two exact directories, one Graphify tree, one OpenCode listener, no local Graphify child, equal tool/result digests, zero provider/PR calls, and complete cleanup. Current installed Status remains composite healthy with one 4096/4097 listener.
- **Outcome:** Task 4.1 complete. Current managed runtime remains untouched after installation.
- **Do-Not-Repeat Condition:** Do not start another fixed-port Graphify while managed 4097 is occupied or use current-server clients for destructive resource experiments.
- **Evidence-Based Retry Condition:** Re-evaluate only if Graphify binary/graph/config or equivalent workload changes.

## 2026-08-21 - Prove failure boundaries on proof-owned servers

- **Objective:** Challenge auth, degradation, survival, and recovery without mutating the current managed server.
- **Approach:** Start proof-owned Graphify on `127.0.0.1:4197` and proof-owned OpenCode on an ephemeral port, exercise missing/wrong/correct auth, connect remote MCP, terminate only proof Graphify, verify OpenCode survival and transport absence, restart proof Graphify, reconnect, and clean both trees. Compose existing collision, config rollback/drift, launch failure/popup, tray-state, and installed rollback dry-run evidence.
- **Evidence:** `evidence-task-4-2-degradation-r2/evaluation.json` passes auth closure, initial connection, OpenCode survival, observable Graphify absence, recovery, zero provider calls, secret scan, and cleanup. r1 records that OpenCode's MCP status cache can remain stale `connected`; the controller therefore correctly owns degradation from child exit/state rather than relying on that cache. Task 3.1 contract/handoff prove collision/config restore/failure code/popup; installed rollback dry-run is fully eligible.
- **Outcome:** Task 4.2 complete under the owner's explicit isolated-experiment envelope. Current managed 4096/4097 was not stopped, restarted, degraded, or rolled back.
- **Known Limitation:** Actual tray/Desktop Restart replacement and current-server rollback were intentionally not executed after the owner prohibited current-server disruption; their process/state/config mechanisms are covered by source, detached install, handoff, temp rollback, and proof-owned restart evidence.
- **Do-Not-Repeat Condition:** Do not use stale OpenCode MCP status as degradation proof and do not inject failures into the current managed server without new explicit permission.
- **Evidence-Based Retry Condition:** Run an actual managed Restart/rollback only after explicit owner permission and a new before-state/restoration bundle.

## 2026-08-21 - Synchronize operator documentation

- **Objective:** Document the implemented schema2 hybrid runtime and exact safe commands.
- **Approach:** Update `tools/windows/README.md` with Graphify config/auth, sharing matrix, degraded behavior, rollback semantics, validation commands, secret boundary, and Node/Bun non-goal; extend the proof inventory for every maintained runner/evaluator.
- **Evidence:** Repository/source help exits 0; post-install preflight returns `collision` plus `already-managed` config identity; installed Status is composite healthy; rollback dry-run is eligible with every identity/config/backup check true. No secret values appear in docs or command output.
- **Outcome:** Task 4.3 complete. Accepted implementation scope is complete under the owner-directed proof-owned failure envelope.
- **Do-Not-Repeat Condition:** Do not document raw credentials, stale schema1 fields, or destructive current-server examples as routine validation.
- **Evidence-Based Retry Condition:** Update docs if command paths/schema/endpoints or observed limitations change.

## 2026-08-21 - Correct critical stale-PID cleanup risk and complete SDET

- **Objective:** Disposition the fresh SDET claim that a long degraded interval could reuse an exited Graphify PID before cleanup.
- **Approach:** Reproduce from source, replace liveness-only child cleanup with `terminateRecordedProcess` creation/executable/command identity validation, extend identity handoff proof, and recapture the corrected source on a proof-owned Graphify/OpenCode pair while preserving managed 4096/4097.
- **Evidence:** `evidence-task-5-1-identity-r3` and replay pass recorded-identity termination wiring plus handoff/failure/cleanup. `evidence-task-5-1-corrected-private-r3` passes auth, connection, Graphify loss, OpenCode survival, recovery, managed-port continuity, secret scan, and cleanup, attributed to source SHA256 `329949be...`. Fresh corrected-candidate SDET (`ses_fdb428338ffen6oGF7dOKXkle7`, Effective Model `xai/grok-4.6`) returns `Action: no-critical-risk` and closes the prior stale-PID incident.
- **Outcome:** Task 5.1 complete. Current managed server remains the older healthy MVP by owner instruction; corrected candidate qualification is private/source-scoped.
- **Do-Not-Repeat Condition:** Do not terminate a recorded PID from liveness alone and do not transfer the old-candidate SDET verdict to corrected source.
- **Evidence-Based Retry Condition:** New SDET only after behavior-affecting production mutation or a distinct critical hypothesis.

## 2026-08-21 - Freeze source/private RC1 and complete the local handoff

- **Objective:** Complete task 5.2 without disrupting the owner-managed `4096`/`4097` runtime or attributing unrelated worktree failures to this candidate.
- **Candidate Reference:** Controller SHA256 `329949BE23B38418016B89E3A027F845BB9D79F8D14154B90FCA730FBCC7CEAA`; shared-tool SHA256 `A5E87EFC4ACAD0A4791579D80A5DB9468958376B2B09A4218A2A8A4DF133DA51`; combined candidate `95b9ee1275fbbc8e7e72cbf1eba4f2eb4c24d7df4e3a874eb4f4d6015de89634`.
- **Runtime Proof:** `evidence-task-5-1-corrected-private-r3` proves the corrected controller against a proof-owned OpenCode/Graphify pair, including authentication, connection, Graphify loss, OpenCode survival, recovery, managed-port continuity, secret containment, and cleanup. Installed read-only Status separately reports OpenCode `200`, Graphify unauthenticated `401` and authenticated `200`, the exact ten-tool inventory, and exactly one listener on each managed port.
- **Replay And Resource Evidence:** `evidence-task-5-2-contract-replay-r1`, `evidence-task-5-2-integration-replay-r1`, and `evidence-task-5-2-identity-replay-r1` all pass with `liveCalls: 0`. `evidence-task-5-2-resource-replay-r1` passes the 35% gate with improvement `0.49858712581786047` and readiness allowance `21720` ms.
- **Critical SDET:** Fresh corrected-candidate session `ses_fdb428338ffen6oGF7dOKXkle7` (Effective Model `xai/grok-4.6`) returned `Action: no-critical-risk`. No later behavior-affecting production mutation occurred.
- **Validation:** Both controller and shared-tool `node --check` commands exit `0`; focused session-plugin tests pass 17/17; the full `npm.cmd test` suite exits `0`; `npm.cmd run validate:strict` reports zero warnings; and `openspec.cmd validate optimize-shared-opencode-runtime-resources --strict` passes. `npm.cmd run openspec:validate` reports this change green and 16/17 items green, but exits non-zero solely for the unrelated active `reduce-workflow-ceremony` change's omitted MODIFIED scenarios; those files were not changed.
- **Installed Environment:** The owner-managed runtime remains healthy on the older controller `03358B5077C186A5006DE3AAC87C3346C96A8952D7A65A19FED330FA1F56AD50` and combined manifest candidate `db50301a63b53a70507d739cc6974a3fa8ffd7eb0294102c9b0742e3959e7bfa`. The current Graphify entry exactly matches the reconstructed managed entry, but unrelated `instructions.0` and `instructions.1` config changes altered the whole-file hash from `F39DCD36C9331075E470525EC86594034439DD93B6BEB597FF449D83D233E506` to `5E570C67CD140E4C0F97F334252571EE77DA493DC265EB4C763C23219D89BE5D`; rollback dry-run therefore correctly reports `eligible: false` and no rollback was attempted.
- **Non-Goals:** No ProgramData repair, Stop, Restart, rollback, Desktop mutation, provider/model request, remote PR operation, target-repository mutation, Node-to-Bun conversion, Serena/LSP pooling, commit, push, release, deployment, or publication.
- **Known Non-Critical Limitations:** ProgramData still runs the older healthy MVP and must not inherit the source/private RC claim. Actual managed tray/Desktop Restart and rollback remain unexecuted under the owner's no-disruption boundary. The old installed preflight cannot resolve `jsonc-parser` from ProgramData, and source preflight fails closed while the whole config identity is drifted; repository-documented source help and read-only Status remain available.
- **Outcome:** Task 5.2 complete. `Outcome: working`. `Development-Stage: stable`. `Stable Candidate: RC1`. This stage applies only to the repository/private candidate above and does not authorize or claim ProgramData activation.
- **Live-Attempt Gate:** Blocked for ProgramData activation and destructive managed-runtime evidence. **Failure Chain:** owner no-disruption instruction plus completion-guard route `audit_4dbc4077c65b`. **Preserved Raw Bundles:** task 1.1 baseline, task 2.2 integration r11, task 3.2 install r1, task 4.2 degradation r2, and task 5.1 corrected-private r3/identity r3. **Offline Replay Coverage:** all task 5.2 replay bundles above are green. **Terminal Replay Result:** pass. **Unlock Condition:** explicit owner authorization plus a fresh stopped identity/config/restoration preflight; current unrelated config drift must be reconciled without overwriting owner changes.
