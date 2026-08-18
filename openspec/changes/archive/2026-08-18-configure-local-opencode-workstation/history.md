# Strategy History

## 2026-08-17 - Bare OpenSpec command through PowerShell resolution

- **Objective:** Inspect active changes at the start of workstation exploration.
- **Approach:** Invoke bare `openspec list --json` from the current PowerShell host.
- **Evidence:** PowerShell resolved `openspec.ps1` under the installed Node package and stopped it with `PSSecurityException` because script execution is disabled; OpenSpec did not run or mutate state. The installed `openspec.cmd` shim subsequently returned the expected JSON.
- **Outcome:** Rejected for this host; all OpenSpec operations in this change use the verified `.cmd` shim.
- **Reason:** Command resolution selected a blocked PowerShell script shim before the executable command shim.
- **Do-Not-Repeat Condition:** Do not invoke bare `openspec` from this PowerShell host while the current execution policy and command resolution remain unchanged.
- **Evidence-Based Retry Condition:** Retry bare `openspec` only after execution policy or command resolution changes and a no-effect `list --json` probe succeeds; otherwise continue with `openspec.cmd`.

## 2026-08-17 - One implicit server per project TUI

- **Objective:** Give each repository an OpenCode terminal without separate lifecycle tooling.
- **Approach:** Keep launching ordinary `opencode` inside each Alacritty repository window and let every TUI start its own random-port server.
- **Evidence:** Current process inspection found three separate Alacritty/PowerShell/OpenCode TUI-server stacks. Installed `opencode --help`, `serve --help`, and `attach --help` plus official server documentation confirm that ordinary TUI startup owns a server and that multiple clients can instead attach to one standalone server with `--dir`.
- **Outcome:** Rejected in favor of one explicit shared server and attached clients.
- **Reason:** The current strategy duplicates server and MCP initialization and cannot satisfy the requested reuse or explicit Start/Restart ownership.
- **Do-Not-Repeat Condition:** Project launchers must never invoke ordinary `opencode` startup or fall back to it when the shared server is unavailable.
- **Evidence-Based Retry Condition:** Reconsider per-TUI servers only if a future supported OpenCode release removes multi-directory attach or an installed proof demonstrates unavoidable cross-project isolation failure in the shared server.

## 2026-08-17 - Global RUNASADMIN compatibility setting for Alacritty

- **Objective:** Guarantee elevated Alacritty sessions with the smallest Windows setting.
- **Approach:** Mark `alacritty.exe` globally with the per-user AppCompat `RUNASADMIN` layer so every invocation requests elevation.
- **Evidence:** No current AppCompat layer is configured for Alacritty. During clarification, the owner selected admin behavior for the four project and two server workflow entry points, not every unrelated Alacritty launch. Elevated Alacritty also consumes user-writable configuration unless the launcher supplies a protected command/config boundary.
- **Outcome:** Rejected in favor of shortcut-scoped self-elevation through a protected fixed controller.
- **Reason:** Global elevation widens the privileged surface beyond the accepted six entry points and makes ordinary terminal use unnecessarily privileged.
- **Do-Not-Repeat Condition:** Do not add global `RUNASADMIN`, executable manifest changes, or global compatibility elevation under this change.
- **Evidence-Based Retry Condition:** Reconsider only after an explicit owner scope change requiring every Alacritty invocation to be elevated and a design that protects all elevated startup inputs.

## 2026-08-17 - Detached hidden server process with PID-only restart

- **Objective:** Start a background elevated server from a Desktop script with minimal setup.
- **Approach:** Have an elevated launcher call `Start-Process opencode serve`, retain one PID, and make Restart kill that PID before starting another process.
- **Evidence:** The installed OpenCode command uses a shim/child process chain, current process inspection shows parent and installed-binary descendants, and existing local proof history records orphaned `opencode serve` processes after parent/cleanup failure. A PID alone does not establish creation identity, descendant ownership, task ownership, or listener ownership.
- **Outcome:** Rejected in favor of a manual highest-privilege Scheduled Task plus protected supervisor/server identity state and post-stop tree/listener proof.
- **Reason:** PID reuse, parent exit, and orphaned descendants make PID-only termination unsafe for both availability and unrelated-process protection.
- **Do-Not-Repeat Condition:** Do not use a detached process or stale PID file as sole lifecycle ownership, and do not kill a listener merely because it occupies port `4096`.
- **Evidence-Based Retry Condition:** Reconsider only if OpenCode exposes a supported single-process daemon lifecycle with authenticated stop/status identity or Windows provides a verified stronger owner that removes the shim/descendant ambiguity at lower cost.

## 2026-08-17 - Unauthenticated loopback elevated server

- **Objective:** Avoid credential distribution between the server and six launchers.
- **Approach:** Bind the elevated server to `127.0.0.1:4096` without `OPENCODE_SERVER_PASSWORD` and rely on loopback reachability as the boundary.
- **Evidence:** Official OpenCode server documentation and installed help expose Basic authentication through `OPENCODE_SERVER_PASSWORD`. Existing local server logs explicitly warn when the password is absent. Loopback prevents remote reach but does not prevent another local process from calling the elevated HTTP automation API.
- **Outcome:** Rejected; the selected design generates a local password, stores it under administrator-only ACLs, and passes it only through inherited process environment.
- **Reason:** An unauthenticated elevated automation endpoint is an avoidable local privilege boundary weakness.
- **Do-Not-Repeat Condition:** Do not start or accept the final elevated server without authentication, and do not place the password in argv, Desktop artifacts, repository files, or logs.
- **Evidence-Based Retry Condition:** Reconsider only if OpenCode adds a stronger Windows-native authenticated local transport or the server is deliberately changed to a non-elevated, non-privileged operating envelope by explicit owner decision.

## 2026-08-17 - Version-sorting stable and Preview PowerShell installations

- **Objective:** Make Alacritty select the newest PowerShell after future upgrades.
- **Approach:** Enumerate stable and Preview installations at every launch, compare versions, and execute the numerically newest binary.
- **Evidence:** The host currently has Store PowerShell `7.6.5` exposed through the stable `pwsh.exe` App Execution Alias, while Preview uses a separate alias. The owner explicitly selected latest stable rather than Preview-inclusive resolution.
- **Outcome:** Rejected in favor of resolving `pwsh.exe` by name and validating that it is non-Preview PowerShell Core.
- **Reason:** Windows already maintains the stable alias across Store upgrades; a custom resolver adds policy and failure modes without user value.
- **Do-Not-Repeat Condition:** Do not add package enumeration, version sorting, or Preview fallback while the stable alias remains supported and selected.
- **Evidence-Based Retry Condition:** Reconsider only if the stable alias disappears or fails under an actual required launch boundary and another installed stable discovery mechanism is proven.

## 2026-08-17 - Manual protected Scheduled Task and fixed launcher controller

- **Objective:** Provide one reusable elevated server, six predictable operator entry points, safe restart ownership, and reversible machine-local setup without a Windows service or new dependency.
- **Approach:** Reuse OpenCode `serve`/`attach`, the stable PowerShell alias, Alacritty explicit config/command selection, Windows Task Scheduler, ACLs, known folders, WSH shortcuts, and OS cryptographic RNG. Build one minimal repository controller, copy it into an administrator-only `%ProgramData%` root, keep a protected allowlisted manifest and credential, register one no-trigger highest-privilege server task, and make six Desktop shortcuts invoke fixed protected modes.
- **Evidence:** Repository search found no existing workstation/task/shortcut owner; existing process cleanup is proof-specific. Host inspection verified all required platform executables, the user-level global config source, Desktop path, and four Git worktrees. The owner selected manual Start/Restart, latest stable PowerShell, and admin behavior for all six workflow entry points.
- **Outcome:** Selected for `proposal.md`, `specs/local-opencode-workstation/spec.md`, `design.md`, and `tasks.md`; no production or host implementation has been attempted yet.
- **Reason:** This is the smallest composition that satisfies reuse, elevation, authentication, fixed repository routing, diagnostics, ownership-safe Restart, and rollback while keeping privileged runtime inputs out of user-writable locations.
- **Do-Not-Repeat Condition:** Do not add a Windows service, auto-logon trigger, tray UI, per-project task, remote binding, new package, arbitrary path broker, or duplicated launcher scripts while this native composition remains viable.
- **Evidence-Based Retry Condition:** Revisit the selected owner only if effect-free preflight or actual current-host proof demonstrates a concrete Task Scheduler, alias, process-tree, authentication, GUI, ACL, or rollback defect that cannot be corrected within this bounded design.

## 2026-08-17 - Repository PowerShell controller source

- **Objective:** Implement the selected workstation owner in the language closest to Windows task, ACL, shortcut, and elevation APIs.
- **Approach:** Add `tools/windows/opencode-workstation.ps1` with effect-free help, read-only preflight/status, strict parsing, and privacy-safe JSON output.
- **Evidence:** After one corrected PowerShell interpolation syntax defect, AST parsing, `--help`, preflight, status, and negative mode/repository/surplus-argument checks all passed with zero host mutation. The required `npm.cmd run validate:strict` then failed with `ERROR: Non-TypeScript source/tooling file is not allowed: tools/windows/opencode-workstation.ps1`; `tools/validators/markdown.ts` and its mutation controls intentionally enforce TypeScript-only repository tooling.
- **Outcome:** Rejected as a repository source strategy before host installation; the `.ps1` candidate is removed and no host artifact exists.
- **Reason:** Adding an exception would weaken a current architecture boundary and create a second tooling language where Node standard APIs plus bounded Windows command adapters can satisfy the same accepted behavior.
- **Do-Not-Repeat Condition:** Do not add PowerShell source under `tools/**`, weaken the TypeScript-only validator, or hide PowerShell source under another extension for this change.
- **Evidence-Based Retry Condition:** Reconsider a maintained PowerShell source only through a separately accepted repository architecture change with validator and ownership evidence; the current change instead retries with one TypeScript controller and no new dependency.

## 2026-08-17 - Waiting on a detached project shortcut process tree

- **Objective:** Invoke the actual `opencode-kit` Desktop shortcut and wait for the short-lived protected controller to return before inspecting its Alacritty client.
- **Approach:** Call `Start-Process -FilePath <shortcut> -PassThru -Wait` from the proof wrapper, then collect the new Alacritty descendants.
- **Evidence:** The shortcut successfully created one protected-config Alacritty tree with stable PowerShell and `opencode attach --dir`, but PowerShell `-Wait` followed the detached GUI process tree and the wrapper reached the 120-second shell timeout. Post-timeout attribution found exactly one new Alacritty root PID `18268` with expected descendants and no duplicate launcher; the timed wrapper was gone. The client tree was fully captured and terminated by its root while the managed server remained healthy.
- **Outcome:** Rejected as a proof-runner wait strategy; product behavior was captured independently and remained green.
- **Reason:** `.lnk`/`Start-Process -Wait` completion is not the short-lived controller boundary when the controller launches a detached GUI descendant.
- **Do-Not-Repeat Condition:** Do not use `-Wait` or an outer shell timeout to detect completion of project Desktop shortcuts.
- **Evidence-Based Retry Condition:** For later shortcut proof, snapshot existing Alacritty PIDs, invoke without `-Wait`, poll only for one new protected-config Alacritty root and expected attach descendants, then close that exact tree.

## 2026-08-17 - Health-ready before correlated running state

- **Objective:** Return complete Start evidence only after the authenticated endpoint and persisted process/listener ownership agree.
- **Approach:** Initially treat authenticated `/global/health` success as sufficient readiness and immediately return the current state file.
- **Evidence:** The repaired candidate returned `status: started` and healthy `200` while `server-state.json` still contained `status: starting` and no listener; the same state advanced to `running` with one listener moments later.
- **Outcome:** Corrected before further Restart proof by adding a bounded wait for matching candidate, `running` status, and exactly one recorded listener after health becomes ready.
- **Reason:** Endpoint readiness and supervisor identity persistence race independently; returning the earlier observation weakens Start/Restart correlation evidence.
- **Do-Not-Repeat Condition:** Do not use health success alone as terminal managed-server readiness.
- **Evidence-Based Retry Condition:** Retry Start only after source checking and stopped repair; require the returned JSON itself, not a later poll, to include correlated running state and one listener.

## 2026-08-17 - Repository-owned reproducible workstation input

- **Objective:** Make every non-secret setup input and operator command reproducible from `opencode-kit` on another compatible workstation while preserving the selected six-shortcut UX.
- **Approach:** Add one strict schema-versioned JSON repository-path configuration, optional `--config <path>` on effect-free preflight/install, protected-manifest configuration identity, and repository operator instructions. Keep generated credential and installed runtime state host-local.
- **Evidence:** Current-repository search found no configuration loader or workstation installer to reuse. Node filesystem/JSON APIs already used by the controller cover strict parsing without a dependency. Source check, configured preflight, missing-config rejection, help, and strict repository validation are green; preflight reports the expected configuration hash, four exact Git roots, six shortcuts, and current collision state without mutation.
- **Outcome:** `build-minimal`; selected as the causal change for the next stopped repair. Cross-project discovery is not applicable to this machine-local integration.
- **Reason:** A host-only protected copy and hard-coded paths are not reproducible source. One explicit reviewed config keeps machine data separate from behavior, validates before mutation, and avoids a package or fleet installer.
- **Do-Not-Repeat Condition:** Do not reconstruct setup from `C:\ProgramData`, copy credentials, add hidden path defaults, or introduce hot reload, a package, or a second installer.
- **Evidence-Based Retry Condition:** Perform the next host repair only after source check, configured preflight, missing-config rejection, and strict validation exit `0`; then require installed source/config hashes and manifest mappings to match the repository inputs before Restart/client proof.

## 2026-08-17 - Empty Alacritty directory rollback cleanup

- **Objective:** Complete identity-matched rollback to the exact pre-install absence state.
- **Approach:** After removing the managed Alacritty config, call Node `rmSync` without directory options on its now-empty parent directory.
- **Evidence:** The first real rollback safely stopped/remained stopped, removed all six shortcuts and the task, and removed the managed config, then exited `1` with `ERR_FS_EISDIR` for `C:\Users\noilw\AppData\Roaming\alacritty`. Immediate readback showed no listener/task/shortcuts/config, an empty Alacritty directory, and the intact protected root/manifest needed for recovery.
- **Outcome:** Corrected `development` candidate uses `rmdirSync` only after exact empty-directory readback and adds pre-effect rollback validation of any required Alacritty backup hash. The partial state was completed with the reviewed repository source after `node --check`, a disposable empty-directory API probe, and strict validation. A fresh stopped install then passed full dry-run checks and a second complete installed-controller rollback removed all six shortcuts, task, config/directory, and protected root with exit `0`; exact baseline readback was green.
- **Reason:** `rmSync` treats a directory as `EISDIR` unless recursive directory deletion is requested; recursive deletion would be unnecessarily broad after a race-prone emptiness check. `rmdirSync` is the narrow fail-closed operation and refuses a non-empty directory.
- **Do-Not-Repeat Condition:** Do not use file-only `rmSync` or recursive deletion for the ordinary Alacritty parent directory, and do not defer backup-presence/hash validation until after task/shortcut removal.
- **Evidence-Based Retry Condition:** Any later rollback attempt requires current installed/source hash correlation, `rollback --dry-run` with every check including `alacrittyBackup: true`, and a stopped or positively identified managed tree. After a rollback failure, preserve and inspect the partial state before any repetition.

## 2026-08-18 - Health readiness before listener ownership

- **Objective:** Ensure no server lifecycle or client path treats an uncorrelated local listener as the protected managed server.
- **Approach:** The earlier candidate sent its authenticated health request first and accepted any `200` response carrying `healthy: true`; only an unhealthy response reached the port-owner guard.
- **Evidence:** Fresh SDET `ses_fef323a3fffeTVyzzXjgqj91DM` reported `WS-CR-01`. Main positively stopped only the recorded managed tree and ran one bounded local reproduction. Candidate `1B607F16AF43C706249C20871AC57F6E7D5C38A75023CB8CFAA7FF5823CDA30B` returned `status: reused` and version `proof-impostor` for an unrelated loopback process; the proof process recorded only that Basic Authorization was present, never its value. The process was removed by its exact PID/command identity and the real server was restored.
- **Outcome:** Confirmed critical current-outcome defect. Candidate `10808B37D796083F1E262A0B4856F640E08229AE84B1F36224B285360F6F1270` validates task, candidate, supervisor/root/listener process identities and current listener ownership immediately before any credential-bearing health check. During `serve`, it waits for a loopback `opencode-serve` listener descending from the spawned managed root before readiness. A plain proof listener then made Start, Status, Launch, and Restart all exit `1` before health/client effects; its identity remained unchanged and it was removed by its PTY identity. Real Start, idempotent Start, all four launchers, Restart, and post-Restart attach remained green across the correction; the final freshness-only patch was rechecked with representative Start/attach/Restart and the full collision matrix.
- **Reason:** Endpoint payload shape is not process ownership. The task/process/listener chain is the trusted local identity boundary and must precede an authenticated endpoint observation.
- **Do-Not-Repeat Condition:** Do not send the managed server credential, reuse a server, launch a client, or report authenticated Status based only on an endpoint response. Do not use a stale environment snapshot after repository/config checks.
- **Evidence-Based Retry Condition:** Any future health-path change requires source/installed hash correlation, a no-HTTP unrelated-listener rejection for Start/Status/Launch/Restart, one real managed Start, one idempotent Start, one attached client, actual Restart with old-tree absence, and post-Restart health.

## 2026-08-18 - Sequential launcher proof missed concurrent clients

- **Objective:** Prove the intended one-server/multiple-client operator workflow, including two different project clients alive simultaneously.
- **Approach:** Tasks 3.2, 4.2, and 4.3 launched each project, captured it, and closed it before launching the next project.
- **Evidence:** The owner later reported Start -> `pmac-emulator` succeeded but a following `opencode-kit` shortcut failed and had to be started manually. The installed controller logged only `serve` errors, so the original launcher cause was not recoverable. Current readback found the owner `pmac-emulator` attach tree alive, the manually started ordinary `opencode -c` tree alive, one healthy server, and matching source/installed/manifest/state hashes. A direct protected launch and then the actual `OpenCode - opencode-kit.lnk` both succeeded while those trees remained alive. During the actual `.lnk` proof, `pmac` root/attach PIDs remained alive, the new kit attach used its exact directory, one listener PID remained unchanged, and cleanup removed only the new kit tree.
- **Outcome:** Current candidate does support simultaneous clients, so the earlier error is not reproduced. Added an explicit concurrent-client requirement and task 4.4. All controller operation failures, not only `serve`, now append secret-free JSON diagnostics under the protected logs path so a recurrence has an exact cause.
- **Reason:** Sequential per-launcher proof established mapping correctness but not concurrent shared-server behavior. Restricting diagnostics to the server owner also made a transient launcher failure unobservable after its console closed.
- **Do-Not-Repeat Condition:** Do not claim multi-client behavior from sequential launch-and-close captures, and do not leave Desktop launcher errors solely in an ephemeral console.
- **Evidence-Based Retry Condition:** Future launcher changes require one real first client kept alive, a second actual `.lnk` client, exact distinct mappings, one unchanged listener/server tree, first-client survival after second-client cleanup, and protected error-log readback for a safe negative launcher case.

## 2026-08-18 - Single health probe rejected the second concurrent client

- **Objective:** Launch a second exact project client while the first newly attached client remains active on the shared server.
- **Approach:** Validate server ownership, perform one health request with a two-second request timeout, and fail the launcher immediately on a transient timeout.
- **Evidence:** On installed candidate `CC19913BF4C74B7EBA47D4BE36D3A0B55740B066F390185D7364CBA8B68C973A`, a fresh proof-owned `pmac-emulator` attached successfully, then the immediate actual `opencode-kit.lnk` created no Alacritty root. Protected `controller-errors.log` recorded operation `launch` and `Shared OpenCode server is unavailable; run the Start shortcut first.` Immediately afterward installed Status returned complete integrity and health `200`/`1.18.18` on the same unchanged server/listener PIDs. The first proof client was cleaned; owner clients were preserved.
- **Outcome:** Confirmed concurrent-launch outcome defect. Candidate `14CD0165B87729EB6D7152E6B846D7973DF64A24369693DA61C85ADF51DAB724` retries only temporary health unavailability for at most 15 seconds, revalidating current managed ownership before every request and failing authentication errors immediately. The repeated exact `.lnk` sequence kept new pmac root/attach PIDs `16260` / `8320,7968` alive while new kit root/attach PIDs `9704` / `18284,8648` attached to the same listener PID `20932`. Closing kit left pmac alive; final cleanup removed only both proof trees and preserved owner windows/server identities.
- **Reason:** First-client initialization can temporarily delay the shared server health response beyond the single request timeout even though the managed task/process/listener remains valid and healthy. A bounded ownership-validated retry distinguishes temporary load from wrong ownership or authentication.
- **Do-Not-Repeat Condition:** Do not use a single health request as availability proof for concurrent client launch, and do not retry without refreshing task/process/listener ownership before each request.
- **Evidence-Based Retry Condition:** Re-run two fresh actual project shortcuts without delay, retain the first through second-client attach, require one unchanged server listener/tree, close the second and prove first survival, then clean only proof-owned roots.

## 2026-08-18 - Direct Windows npm.cmd archive validation adapter

- **Objective:** Complete deterministic archive with the repository-native `npm.cmd run prepush:validate` gate.
- **Approach:** Pass the absolute `npm.cmd` path directly as the archive helper's validation executable.
- **Evidence:** The helper completed OpenSpec status (`artifacts=4`, `tasks=13/13`) and strict target validation, then direct process execution of the `.cmd` wrapper exited `1` with Windows command-wrapper execution failure. Official archive was not invoked and no spec/archive path changed.
- **Outcome:** Validation-adapter invocation defect, not Product Candidate or repository-validation failure. Retry through system `cmd.exe /d /s /c` while preserving the exact `npm.cmd run prepush:validate` project gate.
- **Reason:** Windows command wrappers require a command interpreter when the deterministic helper uses direct process spawning.
- **Do-Not-Repeat Condition:** Do not pass `.cmd` files directly as archive-helper validation executables on this host.
- **Evidence-Based Retry Condition:** Use the verified system `cmd.exe` adapter with the same project validation command and require the helper's terminal `status: archived` result.
