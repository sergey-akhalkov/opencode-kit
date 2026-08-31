## Context

See `proposal.md` for motivation and `specs/local-opencode-workstation/spec.md` for the behavior contract. Read-only discovery established Windows AMD64, an elevated interactive OpenCode process, Node.js `24.18.1`, npm `11.16.0`, OpenCode `1.18.25`, `OPENCODE_CONFIG_DIR=D:\home\sergey-akhalkov\opencode-kit\global`, no explicit or inline config override, and no installed `nuphus-mcp` command. The active gitignored `global/opencode.json` owns machine-local MCP settings and currently has `permission: "allow"` plus enabled Serena, Codebase Memory, and Graphify MCP entries; the host-default and project configs do not declare an overlapping MCP name. The workstation capability separately owns one managed OpenCode server on `127.0.0.1:4096` and Graphify on `127.0.0.1:4097`. The operator explicitly selected full Nuphus authority rather than per-action strict confirmation.

Nuphus `0.2.2` supplies a signed npm registry artifact and matching Windows x64 optional package, and its release workflow completed successfully. Its annotated Git tag is unsigned and the npm metadata has no provenance attestation, so registry integrity and release CI bound transport and published identity but do not prove reproducible source-to-binary equivalence. The server exposes 38 tools over local stdio. Desktop screenshot results are emitted as text containing JSON and base64, not MCP image content, so direct inline screenshot calls do not establish model-visible pixels. `desktop_perceive` returns local OCR/icon coordinates, while a saved PNG followed by OpenCode Read provides the direct visual route without configuring Nuphus `desktop_vision`.

This is a Material machine-local authorization and loaded-config change. Apply work must load the change-ready lifecycle before mutation, preserve the existing user-owned OpenCode processes, modify only the accepted local package/config/instruction and focused proof surface, and use a new proof-owned OpenCode process for activation evidence.

### Fidelity Ladder

`current package/config/runtime inventory -> effect-free package metadata and MCP protocol checks -> pinned package installation -> machine-local config/instruction readback -> direct stdio screen-size/screenshot check -> new OpenCode process connection and image-read observation -> proof-owned Notepad target/input/post-observation -> local perception bootstrap -> rollback rehearsal and focused validation`. The current rung is proposal-time read-only discovery. The next real boundary is the exact package metadata, global-prefix, config-collision, and process baseline immediately before installation. Package/config mutation is authorized for this machine, but existing OpenCode and user GUI processes remain protected; all proof GUI and temporary-file effects require positive identity and bounded cleanup.

## Goals / Non-Goals

**Goals:**

- Extend the existing machine-local OpenCode configuration owner instead of changing portable kit defaults.
- Install one exact package version through the existing Node/npm toolchain and make startup failure cause-preserving.
- Give the primary agent full local desktop write capability while retaining target re-observation and post-action proof.
- Make real screen pixels usable by the active OpenCode model without a second vision provider.
- Retain one small reusable proof owner for package/protocol/observation/process-cleanup regressions.

**Non-Goals:**

- A general MCP package manager, portable Nuphus default, second workstation lifecycle controller, UIA abstraction, custom Nuphus fork, remote desktop service, or background recorder.
- Automating protected remote/destructive decisions, bypassing UAC Secure Desktop, controlling existing user applications during proof, or claiming broad Windows compatibility.
- Testing all browser, cookie, upload, drag, cloud-vision, or application-specific behaviors exposed by the 38-tool surface.

## Decisions

### Decision 1: Use an exact global npm installation and the existing machine-local config owner

Install `@nuphus/nuphus-mcp@0.2.2`, which selects the exact matching `@nuphus/nuphus-mcp-win32-x64@0.2.2`, through the current global npm prefix. Add one unique `nuphus` local stdio entry to `global/opencode.json`; do not modify `global/opencode.json.template`, generated profiles, `tools/install-code-intelligence-mcps.ts`, or `setup:global`.

This is an `extend` disposition for machine-local OpenCode configuration and a `build-minimal` disposition for the focused proof owner. No current owner verifies an arbitrary external desktop MCP's protocol, screenshot shape, and GUI cleanup; the existing shared MCP installer intentionally owns portable Serena and Codebase Memory only, while the Graphify/workstation proof runners own different service and resource contracts. Cross-project reuse is not applicable to a current-host integration.

Alternative rejected: `npx -y @nuphus/nuphus-mcp` at every startup. It adds network/cache variability and weakens exact startup identity. Alternative rejected: add Nuphus to the portable template or shared installer. That silently installs a high-authority desktop tool for unrelated users and platforms. Alternative rejected: unpack the raw GitHub executable. The npm platform package also carries the required ONNX Runtime libraries and has a version-matching launcher/check path.

### Decision 2: Preserve the operator's full-authority selection without strict-confirm mode

The MCP entry sets `NUPHUS_MCP_CONFIRM_WRITE=0` explicitly and uses the existing global `permission: "allow"`. No OpenCode per-tool prompt or Nuphus `confirm: true` argument is added. This makes mouse, keyboard, window, browser, clipboard, and file-oriented browser tools available when main determines they are needed. Active OpenCode instructions remain the authority for protected remote, destructive, privacy, security, data, legal, and product boundaries; full host tool access does not redefine those decisions.

Alternative rejected: `--confirm-write`. It only requires the model to send a boolean and is not a reliable human-authorization boundary; it would add friction without changing the accepted authority. Alternative rejected: an additional allowlist wrapper. The current increment is an exact installation of the selected upstream MCP, and a wrapper would create an unrequested API and maintenance boundary.

### Decision 3: Use local perception first and screenshot-to-Read for actual pixels

The durable local instruction explicitly positions Nuphus as the available observation/input route during UI development or debugging when the required fact or effect is visible only in the running interface; source, logs, and tests remain primary for non-visual facts. It names one desktop flow: list and positively identify windows, activate the target, observe with `desktop_perceive` or a saved screenshot, act, and observe again. When pixels are needed, `desktop_screenshot` writes to a unique proof-owned PNG under the operating-system temporary directory and the primary agent calls OpenCode Read on that path. Inline base64 screenshot results are not accepted as visual evidence. Nuphus `desktop_vision` remains unconfigured, avoiding another credential, model route, and charge. This positioning stays in the one globally loaded machine-local instruction owner rather than being duplicated across project, skill, or agent prompts.

Alternative rejected: treat the inline base64 text as an image. Nuphus `0.2.2` wraps every tool output in MCP text content. Alternative rejected: configure a second vision provider. The active OpenCode model already accepts image attachments through Read. Alternative rejected: rely only on OCR. OCR does not prove layout, graphical state, or elements it fails to recognize.

### Decision 4: Prove the loaded capability through one isolated Notepad loop

Direct protocol checks first verify package version, `initialize`, `tools/list`, screen size, and screenshot-to-file without moving input. After config mutation, the proof helper reuses `configuredProofServerEnvironment` and proof-process cleanup to start `opencode serve` on a newly allocated loopback port with isolated `OPENCODE_DB`, XDG data/cache/config/state, test home, and project roots. It points `OPENCODE_CONFIG_DIR` at the actual active custom source, records the active file digest, and supplies a proof-only `OPENCODE_CONFIG_CONTENT` overlay that sets only the three pre-existing Serena, Codebase Memory, and Graphify entries to `enabled: false`; the overlay does not define `nuphus`. Resolved-config projection must match the active file's Nuphus entry, managed 4096/4097 listener and process identities must be unchanged before and after, and no sibling MCP child may start. A bounded configured-provider request through that exact server verifies `nuphus` connected and invokes its current screen-size tool.

The same proof server then performs one complete GUI loop against a newly launched Notepad instance: capture baseline processes/windows, record the new PID/HWND, activate it, enter a unique non-sensitive marker, observe the marker, close that PID only, delete the temporary PNG, and prove no proof descendant remains. Existing OpenCode processes, the managed server, sibling MCP services, and user windows are never cleanup targets.

The focused proof helper reuses `global/bin/portable-process.ts` plus the existing proof-process cleanup mechanisms. It provides effect-free `--help` and a read-only protocol/check mode before a separately explicit live proof mode. It records package/config hashes, MCP protocol/tool inventory, stdout/stderr, process identity, observation references without screen contents, cleanup, and exact exit. It does not become an installer or a general GUI automation framework.

Alternative rejected: attach to or restart the managed 4096 server. That would mutate an existing owner-controlled lifecycle and make proof cleanup unsafe. Alternative rejected: copy a minimal config that defines Nuphus. It would not prove the edited active source. Alternative rejected: load every active sibling MCP in the proof server. It would duplicate high-cost processes and entangle 4097/credentials with an unrelated oracle. Alternative rejected: accept `opencode mcp list` alone. Connection does not prove model-visible pixels or input effects. Alternative rejected: operate an existing application window. Ownership and cleanup would be ambiguous. Alternative rejected: prove only a successful `desktop_input` result. The accepted effect is the visible marker, not the RPC response.

### Decision 5: Treat restart, model bootstrap, and rollback as explicit state transitions

Config is loaded once. The current session remains untouched; a new proof process provides activation evidence, and the operator restarts the normal session only after checks are green. The first `desktop_perceive` call may download OCR and optional icon models into `%APPDATA%\Nuphus\models`; evidence records sources, resulting file hashes, and degraded icon status, but does not claim independent supply-chain verification. Rollback restores exact pre-change local config/instruction bytes, removes the exact global Nuphus packages when their identities still match, starts a new OpenCode process to prove absence, and removes only positively attributed proof files or optional model files. Drift fails closed.

Alternative rejected: hot-reload claims for the current OpenCode session. Loaded tools are process-start state. Alternative rejected: delete the entire Nuphus app-data tree unconditionally. It may contain later user-owned state. Alternative rejected: auto-update to latest. The upstream supports only latest for security, but automatic upgrades would replace the reviewed candidate without proof; upgrades are explicit successor changes.

## Failure Boundaries And Diagnostics

- **Package preflight/install**: distinguish registry metadata mismatch, unsupported platform, global-prefix write failure, optional platform package omission, postinstall failure, and command-resolution failure; preserve npm's original exit and stderr.
- **Configuration**: parse and validate the complete local JSON before replacement, preserve exact preimage bytes, reject a pre-existing `nuphus` owner collision, and never rewrite unrelated sections.
- **MCP startup**: distinguish command-not-found, launcher/platform mismatch, protocol initialization failure, empty or missing tool inventory, timeout, and premature process exit.
- **OpenCode proof identity**: distinguish managed-port collision, proof port reuse, non-isolated database/XDG state, active-config digest drift, Nuphus overlay shadowing, sibling MCP startup, wrong server/client base URL, and managed 4096/4097 identity change; none may be reported as Nuphus success.
- **Observation**: distinguish screenshot capture failure, save-path rejection, missing PNG, unreadable image attachment, OCR/model bootstrap failure, and optional icon degradation; never substitute guessed coordinates.
- **Input**: require current PID/HWND/title association and target activation immediately before the action; on stale identity, re-observe instead of retrying coordinates.
- **Cleanup/rollback**: preserve unknown or drifted package/config/model/process identities; terminate only proof-owned PID trees and report leftovers rather than broad name-based cleanup.

## Risks / Trade-offs

- **[Risk] Elevated Nuphus can operate any accessible user window** -> Keep proof isolated to an attributed Notepad instance, retain active instruction authority, show the Nuphus HUD, and require target plus post-action observation for ordinary use.
- **[Risk] Published binary is not independently reproducible from the reviewed source** -> Pin both package identities, retain npm integrity/signature and successful release-workflow evidence, record the exact installed hashes, and bound the claim to this candidate; do not claim source equivalence.
- **[Risk] Screen contents enter model context** -> Use bounded window/region captures when sufficient, avoid secrets during proof, remove temporary PNGs, and report the active provider privacy boundary.
- **[Risk] Coordinate/OCR targeting can hit the wrong location** -> Activate and re-identify the HWND, prefer perception centers, do not reuse stale observations, and verify every meaningful state change.
- **[Risk] OCR model downloads are not hash-pinned by upstream defaults** -> Record download sources and observed hashes, preserve failures, and treat local perception as degraded when model validation fails; screenshot-to-Read remains the sufficient visual path.
- **[Risk] 38 tools add context and route ambiguity** -> Use one unique MCP name and concise local routing guidance; do not add duplicate desktop or browser MCPs in this increment.
- **[Risk] A second OpenCode process could collide with or be mistaken for the managed workstation server** -> Allocate an ephemeral port, isolate all mutable runtime roots, hash-attribute the active config and resolved Nuphus entry, disable sibling MCPs only through a proof overlay, and compare managed 4096/4097 identities before and after cleanup.
- **[Risk] Global npm installation can disappear after Node replacement** -> Focused checks verify command and package identities and return an actionable reinstall requirement without silently falling back to `npx`.

## Migration Plan

1. Re-read the effective token, Windows/Node/npm/OpenCode identities, npm registry metadata, global prefix, Nuphus environment variables, loaded config sources, current local config/instruction bytes, existing Nuphus package/command/config/model state, and relevant OpenCode/Notepad process baseline.
2. Implement and run the focused helper's effect-free help and read-only preflight/protocol fixtures; validate the candidate config transformation against the official OpenCode schema without writing the active file.
3. Install the exact global npm package, verify matching meta/platform identities, preserve installed executable/library hashes, and run direct stdio initialize/tools-list/screen-size/screenshot checks.
4. Atomically add the machine-local MCP entry and minimal local instruction while preserving unrelated bytes and exact rollback preimages.
5. Start the isolated ephemeral-port proof server from the active custom source with only sibling MCPs disabled by overlay, prove config/Nuphus/port/DB/XDG/process attribution plus unchanged managed 4096/4097 identities, then prove the connected MCP, screenshot-to-Read path, and Notepad observe-act-observe loop; exercise local perception and record model/bootstrap state.
6. Rehearse rollback decisions against recorded identities, restore the requested installed candidate, run focused and project-native validation, and hand off the exact restart requirement and known limitations.

Rollback removes only matching Nuphus package/config/instruction/proof identities, restores exact preimages, verifies absence in a new OpenCode process, and preserves unrelated work. No commit, push, release, deployment, remote endpoint, cloud credential, or existing user-process termination is part of migration.

## Open Questions

None for the current increment.
