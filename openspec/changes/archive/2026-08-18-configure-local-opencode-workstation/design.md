## Context

See `proposal.md` for motivation and `specs/local-opencode-workstation/spec.md` for the operator contract. Discovery found no existing Alacritty config, shortcut generator, scheduled-task owner, or workstation launcher in this repository. The current host exposes Alacritty `0.17.0`, Store PowerShell `7.6.5` through the stable `pwsh.exe` App Execution Alias, OpenCode `1.18.18`, a persistent user-level `OPENCODE_CONFIG_DIR`, an elevated current session, a OneDrive-backed Desktop known folder, and four verified Git worktrees. Three running TUI stacks demonstrate the current duplicated server behavior.

OpenCode officially supports one `opencode serve` process with multiple `opencode attach <url> --dir <path>` clients. The installed CLI reports a dynamic default port even though current web documentation shows `4096`, so this change must always pass the port explicitly. A shared elevated HTTP server is a security boundary: client elevation does not elevate server-side tools, and an unauthenticated elevated loopback server would expose privileged automation to unrelated local processes.

This is a Material machine-local lifecycle and authorization change. It mutates Windows configuration, protected files, a highest-privilege task, Desktop entry points, and a privileged local server. Apply work requires the already granted owner authorization for this exact current machine, must re-verify the effective elevated token immediately before host mutation, and must preserve an exact rollback record.

### Fidelity Ladder

`current host/CLI/config inventory -> provider-free source parsing, --help, and read-only preflight -> disposable manifest/ACL/task-definition evaluation without registration -> actual protected installation on the current host -> Start and authenticated health/reuse proof -> one project launcher proof -> all four launcher and restart/cleanup proof -> rollback rehearsal from recorded identities -> fresh critical-only Material SDET -> complete local validation and handoff`. The current rung is planning from read-only current-host and official CLI evidence. The next real boundary is the repository controller's effect-free `--help` and preflight. Host mutation is separately authorized only when `/opsx-apply` begins; safeguards are exact paths and identities, loopback-only networking, no provider/model call, no repository target mutation, one writer, create-before-switch installation, fail-closed ownership checks, bounded diagnostics, and restoration from recorded hashes and backups.

## Goals / Non-Goals

**Goals:**

- Keep one cohesive workstation owner for setup, protected runtime control, status, and rollback rather than distributing privileged command strings across six shortcuts.
- Make the shared server's process, task, endpoint, credential, configuration source, and repository mapping observable and positively identifiable.
- Use native Windows and installed OpenCode/Alacritty/PowerShell mechanisms without another package, service wrapper, or resident broker.
- Reach the real operator boundary quickly: effect-free preflight first, then the actual reversible host installation and Desktop entry points.
- Keep the complete non-secret setup, machine configuration contract, operator commands, and rollback route in `opencode-kit` so installed host artifacts can be recreated rather than reverse-engineered.

**Non-Goals:**

- A fleet deployment system, package, Windows service, tray UI, auto-update system, remote endpoint, firewall configuration, or generic process supervisor.
- Supporting arbitrary repositories, users, ports, terminal emulators, shells, preview PowerShell, or OpenCode server versions in this increment.
- Hiding UAC, retaining clients across Restart, or making a user-writable repository or Desktop artifact a silent privileged execution source.

## Decisions

### Decision 1: Reuse the supported standalone server and attach protocol

Run one explicit `opencode serve --hostname 127.0.0.1 --port 4096` and make every project entry point use `opencode attach http://127.0.0.1:4096 --dir <mapped-path>`. Client launchers first perform authenticated health and directory preflight and never fall back to ordinary `opencode` startup.

Alternative rejected: keep launching one TUI/server pair per repository. It reproduces the observed duplication and does not satisfy reuse. Alternative rejected: attach all clients without `--dir`; server-side project identity would depend on incidental startup state rather than the selected shortcut.

### Decision 2: Use one manual highest-privilege Scheduled Task as lifecycle owner

Install one task named for the local OpenCode workstation server, with the current user principal, highest run level, no triggers, one-instance policy, no execution time limit, and an action that starts the protected controller in `serve` mode. Start invokes the task only when authenticated health is absent and the endpoint is free. Restart validates task, persisted process, executable, creation-time, command, and listener identities; terminates the validated supervisor/server tree; proves every recorded process and listener is gone; and then starts the same task.

The protected server host records supervisor and OpenCode process identities before declaring readiness. Restart uses the live parent/descendant graph while the supervisor exists and can use the persisted OpenCode root only when every stored identity still matches. Any ambiguity fails closed. The implementation must demonstrate descendant cleanup because prior local proof work observed orphaned `opencode serve` descendants.

Alternative rejected: a detached hidden process plus a PID file. PID reuse, parent exit, and orphaned descendants make ownership weaker. Alternative rejected: a Windows service. It adds installer/service-account/recovery complexity and conflicts with manual interactive-session scope. Alternative rejected: one scheduled task per project. Project clients do not need a second lifecycle owner and fixed task arguments would multiply privileged configuration.

### Decision 3: Keep privileged runtime inputs under an administrator-only root

Maintain one reviewed TypeScript controller source under a cohesive repository tooling directory. Node executes the source directly through its built-in TypeScript support; bounded PowerShell commands are used only as Windows API adapters and are never maintained as repository source. Installation copies the exact reviewed controller into a dedicated `%ProgramData%` root, disables inherited access, and grants modification only to `SYSTEM` and `BUILTIN\Administrators`. The protected root contains the installed controller, an allowlisted manifest, server credential, lifecycle state, a minimal elevated Alacritty config, bounded controller diagnostics, and pre-change identity/backup metadata.

The repository contains one strict non-secret JSON configuration with schema version `1` and exactly the four repository ID/path mappings. Relative paths resolve from the configuration file; installation validates each exact Git root, records the configuration path/hash and resolved paths in the protected manifest, and requires an explicit stopped repair or reinstall to apply changes. Unknown or missing keys fail before mutation. The manifest also records exact executable paths, current user SID, `OPENCODE_CONFIG_DIR`, Desktop known-folder path, endpoint, and task identity. It contains no credential. The credential is generated with the operating-system cryptographic RNG and supplied to server and client children only through `OPENCODE_SERVER_PASSWORD` in memory. No protected task action points back to the user-writable repository copy.

Alternative rejected: execute the repository script directly from the elevated task. Any unelevated same-user process could modify it before a privileged invocation. Alternative rejected: put scripts or a password directly on Desktop. Desktop is user-writable and OneDrive-synchronized. Alternative rejected: an unauthenticated loopback server. Loopback narrows network reach but does not prevent another local process from driving the elevated API.

### Decision 4: Use shortcut-scoped elevation with a fixed protected command surface

Create six Desktop shortcuts resolved through the Windows known-folder API. Each invokes only the protected controller with one fixed mode and, for project launchers, one allowlisted repository ID. The controller self-elevates through the standard Windows `runas` verb when required, verifies the elevated token before privileged behavior, and rejects unknown modes, IDs, paths, or surplus arguments before launching a child.

The four project modes start Alacritty with an explicit protected minimal config and explicit stable `pwsh.exe` child command, then run `opencode attach` with the protected mapping. The explicit config prevents elevated Alacritty from treating the ordinary user-writable config as its shell authority. Ordinary Alacritty separately receives the minimal stable-shell selection in `%APPDATA%\alacritty\alacritty.toml`; setup records and preserves any pre-existing bytes before a scoped update.

Alternative rejected: mark every `alacritty.exe` launch globally `RUNASADMIN`. The user selected elevation for the six workflow entry points, not unrelated Alacritty use, and global elevation would unnecessarily widen the privileged surface. Alternative rejected: embed repository paths, credentials, or full commands in shortcuts. User-writable shortcut arguments must not become an arbitrary admin-command broker.

### Decision 5: Resolve stable PowerShell by the stable alias, not a versioned package path

Use `pwsh.exe` and validate that it resolves to a non-Preview PowerShell Core installation at preflight and launch. Keep the versioned `WindowsApps` package directory out of config so Store upgrades continue through the stable alias. Capture the resolved executable and version in evidence but do not pin `7.6.5` as a permanent requirement.

Alternative rejected: hard-code the current Store package path, which changes on upgrade. Alternative rejected: enumerate and numerically compare stable and Preview installations, because the owner selected latest stable and Windows already provides distinct aliases.

### Decision 6: Add one effect-aware controller with effect-free help and preflight

The repository TypeScript source exposes `--help` before any file, task, process, UAC, or endpoint effect and lists install, preflight, status, start, restart, launch, rollback, and their required arguments. Preflight and install accept an explicit `--config <path>` and otherwise use the adjacent repository configuration. Preflight strictly validates the configuration and current environment, validates exact repository/executable/config paths, renders intended task/shortcut/ACL identities, and detects collisions without writing. Install and rollback require an elevated token and record every managed artifact and pre-change identity. Status is read-only and secret-free.

This is a `build-minimal` disposition. Current-repository search found reusable process cleanup only inside proof owners and no workstation configuration loader or operator task/shortcut lifecycle contract; reusing proof internals would mix responsibilities. Node's JSON/filesystem APIs provide the strict one-file schema without a dependency. Native Alacritty config, PowerShell aliasing, OpenCode serve/attach/authentication, Windows Task Scheduler, ACLs, known folders, WSH shortcuts, and cryptographic RNG are reused. No package or cross-project source is needed; cross-project discovery is not applicable to this machine-local Windows integration.

Alternative rejected: several independent setup/start/restart/client scripts. They would duplicate elevation, identity, credential, diagnostics, and rollback logic. Alternative rejected: a new package or dependency. Node standard APIs and short encoded PowerShell adapter commands already cover the host boundary without weakening the repository's TypeScript-only tooling rule.

Project clients are independent concurrent consumers of the one shared server. Runtime proof must keep one real attached client alive while launching and observing another exact mapped client, then close only the newly attributed proof tree and verify the first client and managed server remain unchanged. Sequential launch-and-close checks do not prove this requirement.

### Decision 7: Treat host state, proof, and rollback as separate roles

The Product Candidate is the reviewed TypeScript controller and strict repository configuration plus installed Alacritty config, protected runtime root, task, manifest, credential, and six shortcuts. The controller's preflight/status/capture modes are the Proof Runner; deterministic checks over captured identities and endpoint responses are the Evaluator; Windows build, effective token, Node and executable versions and hashes, environment source, Desktop path, configuration hash, and repository identities form Environment Identity. Raw evidence records exact redacted invocations, exits, stdout/stderr, process/task/token/ACL/endpoint facts, file hashes, shortcut targets without secrets, and restoration results.

Product Candidate mutation invalidates affected installed runtime proof. Controller-only proof-runner changes invalidate captures it drives; evaluator-only corrections replay preserved observations. Host environment mutation invalidates only lanes that depend on changed executable, path, task, ACL, or config identities.

## Failure Boundaries And Diagnostics

- **Preflight**: fail with the exact configuration/schema field, missing executable, unsupported version/edition, conflicting Alacritty file, invalid Git worktree, Desktop resolution, task/path collision, port owner, or absent elevation prerequisite; make no host mutation.
- **Install**: create protected files and backups before registering task or shortcuts; on failure, remove only artifacts created by the current invocation and restore exact prior bytes/ACLs.
- **Start**: distinguish healthy managed server, authentication failure, unrelated listener, task launch failure, early server exit, and readiness timeout; preserve the original error and bounded native OpenCode/controller log locations.
- **Restart**: refuse ambiguous identity, record the complete pre-stop process tree, terminate only the validated owner, wait for process and listener absence, and never start a replacement while old ownership remains unknown.
- **Launch**: distinguish invalid repository ID/path, missing server, failed authentication, missing executable, failed elevation, and Alacritty/OpenCode early exit without exposing the credential.
- **Client concurrency**: retain exact process attribution for each project; one launch or client exit must not replace the shared server or terminate another client, and launcher failures must be appended to the protected controller error log.
- **Rollback**: compare recorded hashes/task/shortcut identities before removal; preserve and report drift rather than overwrite or delete it.

## Risks / Trade-offs

- **[Risk] Elevated OpenCode executes against user-writable repositories and global configuration** -> Bind and authenticate locally, allow only the four mapped launch roots, keep privileged runtime code protected, and state that repository/config trust remains an accepted residual machine-local risk.
- **[Risk] Task termination leaves an orphaned OpenCode descendant** -> Persist multiple process identities, validate the live tree and endpoint owner, terminate the verified tree, and require post-stop absence proof before replacement or completion.
- **[Risk] Store alias behavior differs under Task Scheduler** -> Exercise the actual highest-privilege task during runtime proof and fail preflight/start with exact alias diagnostics rather than falling back to Windows PowerShell.
- **[Risk] User changes Alacritty config after installation** -> Limit the ordinary config change to shell selection, record original bytes and installed hash, and make rollback preserve drift. Elevated project launchers use the protected config.
- **[Risk] Restart disconnects active clients** -> Keep automatic reconnect out of scope and instruct the operator to relaunch project shortcuts after Restart.
- **[Risk] One server failure affects every repository** -> Preserve actionable Start/Restart/status diagnostics; accept the shared failure domain as the cost of eliminating duplicated server initialization.
- **[Risk] Continuous server output grows without bound** -> Do not duplicate verbose `--print-logs` output indefinitely; retain bounded controller lifecycle records and reference OpenCode's native logs with a documented retention check.

## Migration Plan

1. Re-read the current Alacritty config, executable/version identities, effective token, environment source, Desktop, task namespace, port, and four worktrees; stop before mutation on an unexplained collision.
2. Author the smallest TypeScript controller source, strict repository-path configuration, operator instructions, and effect-free help/preflight/status paths; check them through the installed Node entry point and evaluate a disposable manifest/task/ACL plan.
3. Capture pre-change hashes, bytes, ACLs, task absence, shortcut absence, process/listener state, and rollback metadata.
4. Install the controller, protected config/manifest/credential/state root, and no-trigger highest-privilege task; prove ACL denial from an unelevated probe before starting the server.
5. Apply the ordinary Alacritty stable-shell selection and create the six Desktop shortcuts, preserving exact pre-change items.
6. Prove Start, authenticated health, unauthenticated rejection, idempotent reuse, one project launcher, all four directory mappings, and Restart process-tree cleanup through the actual operator entry points.
7. Rehearse rollback decisions against captured identities without deleting the working candidate, prove rollback and reinstall from the repository source/configuration, then complete fresh critical-only Material SDET, project-native validation, and the local handoff.

Rollback stops only the positively identified managed tree, unregisters only the matching task, removes only matching shortcuts and protected files, and restores the recorded Alacritty bytes/ACLs. Drift is reported and preserved. No commit, push, install of third-party software, remote action, or target-repository mutation is part of migration.

## Open Questions

None for the current increment.
