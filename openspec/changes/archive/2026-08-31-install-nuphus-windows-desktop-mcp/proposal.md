## Why

The current OpenCode runtime can operate files and processes but cannot observe or control the interactive Windows desktop. The operator wants the active primary agent to use the screen, windows, mouse, and keyboard with full local authority when that is the shortest correct route, while preserving a reproducible installation, observable proof, and exact rollback.

## Outcome Capsule

- **Outcome**: On the current Windows workstation, a restarted OpenCode process loads a pinned local Nuphus MCP server and the primary agent can enumerate windows, inspect the screen, operate a proof-owned desktop application with mouse or keyboard input, and verify the visible result through a fresh observation. Globally loaded machine-local guidance explicitly positions Nuphus for UI development and debugging when the required fact or effect is visible only in the running interface.
- **Operating Envelope**: Windows x64 interactive session for user `NEURO\noilw`; elevated OpenCode process; Node.js `24.18.1`; npm `11.16.0`; OpenCode `1.18.25`; active custom source `D:\home\sergey-akhalkov\opencode-kit\global`; machine-local gitignored `global/opencode.json`; exact npm packages `@nuphus/nuphus-mcp@0.2.2` and matching `@nuphus/nuphus-mcp-win32-x64@0.2.2`; local stdio MCP transport; full write authority without Nuphus strict-confirm mode; current interactive desktop only.
- **Non-Goals**: Adding Nuphus to the portable template, generated runtime profiles, `setup:global`, or the shared code-intelligence installer; enabling remote MCP transport; configuring a cloud vision provider or storing a vision API key; auto-updating Nuphus; controlling UAC Secure Desktop, the sign-in screen, a locked or disconnected session, production systems, or unrelated user applications during proof; changing the existing managed OpenCode/Graphify workstation service lifecycle; publishing or releasing anything.
- **Non-Deferrable Invariants**: Preserve unrelated config bytes and worktree changes; install and invoke the exact reviewed package version; never persist a credential; expose only local stdio; preserve the operator-selected full local authority without claiming authority for protected remote, destructive, public, security, privacy, data, legal, or product decisions; never infer success from a click/input response alone; target and clean up only proof-owned GUI processes; keep the current session usable until an explicit restart boundary; make package removal and exact config restoration available.
- **Observable Proof**: Verify npm package identity and MCP handshake/tool inventory; start a proof-owned OpenCode server on an ephemeral loopback port with isolated DB/XDG roots, load and hash-attribute the actual active custom config, and apply only a proof overlay that disables the three sibling MCPs without redefining `nuphus`; prove the resolved Nuphus entry matches the active file and observe `nuphus` connected while managed 4096/4097 identities remain unchanged; list windows and screen dimensions; save a screenshot to a proof-owned temporary PNG and inspect it through OpenCode's image-capable Read tool rather than inline base64; launch a proof-owned Notepad instance, positively identify its PID/HWND, input a unique non-sensitive marker through Nuphus, and confirm that marker through a fresh screenshot or local perception result; close only the proof-owned Notepad and remove temporary evidence after preserving privacy-safe results. Resolve the active instruction list from this repository and at least two unrelated projects, prove all load the same canonical Nuphus guidance, and retain a focused regression that requires explicit UI-development/debugging positioning without displacing source, log, or test evidence for non-visual facts.
- **Material Residual Risks**: Nuphus inherits the elevated OpenCode token and can drive any accessible interactive window; screenshots inspected by the model may be transmitted to the configured model provider; Nuphus desktop targeting is primarily coordinate/OCR based rather than semantic Windows UI Automation; version `0.2.2` is young, its Git tag is unsigned, npm provenance is absent, and registry integrity does not prove source reproducibility; the first local-perception call may download model files from third-party mirrors without default pinned hashes; 38 additional MCP tools increase context and routing surface; a Node/global-prefix change can make the installed command unavailable.
- **Stop Line**: Finish when the exact package is installed, the machine-local MCP entry and minimal local usage guidance are loaded, the real OpenCode connection plus screenshot-to-Read and proof-owned Notepad happy path are green, applicable focused validation passes, cleanup and rollback are proven, and limitations are recorded. Do not add portable defaults, a generic desktop-agent framework, another MCP, UIA replacement, browser-profile migration, cloud vision, auto-update, credential tooling, fleet installation, or unrelated workstation changes.
- **Delivery Horizon:** none - this is a bounded machine-local OpenCode capability installation and is not linked to a declared project delivery horizon.

## Claim And Evidence Scope

- Exact-case claim only: Nuphus `0.2.2` is installed, loaded, and proven on this current Windows x64 workstation through the active OpenCode configuration and the specified screenshot/Notepad oracle; no compatibility, safety, other-version, other-host, population, continuous-vision, or general Windows-application claim is made.

## What Changes

- Install the exact Nuphus meta and Windows x64 platform packages through the current global npm prefix and record their registry identities.
- Add one enabled local stdio `nuphus` entry to the gitignored machine-local `global/opencode.json`, with full write operation enabled and no cloud vision credentials.
- Add minimal machine-local usage guidance that explicitly positions Nuphus for visible-state UI development/debugging while preserving source/log/test evidence for non-visual facts, window activation, screenshot-to-file followed by OpenCode Read, post-action observation, and proof-owned targeting.
- Add the smallest focused deterministic proof owner for package identity, MCP initialization, tool inventory, screenshot response shape, and cleanup evidence, then exercise the real loaded OpenCode GUI happy path.
- Preserve an exact rollback that removes only the Nuphus config entry and package installation, restores the prior local instruction bytes, restarts OpenCode, and optionally removes only models or proof artifacts created by this change.

## Automation Dividend

- **Automation Dividend**: required - add one focused Nuphus Windows desktop proof helper that reuses the repository's portable process and proof-cleanup mechanisms to verify pinned package identity, stdio initialization, expected desktop tool inventory, screenshot-to-file behavior, process attribution, post-action observation, and cleanup without introducing a general MCP installer or a second workstation lifecycle owner.
- **Bounded Falsification Review**: required - full-authority boundary, package/config source selection, screenshot visibility through OpenCode, wrong-window input, proof ownership and cleanup, restart activation, supply-chain identity, unnecessary portable-kit expansion, and sufficiency of the real observable oracle.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `local-opencode-workstation`: Add a pinned, machine-local Windows desktop-control MCP that the active OpenCode agent can load, use through a verified observe-act-observe flow, diagnose, and roll back without changing the portable kit defaults or unrelated workstation state.

## Impact

- Machine-local global npm installation under the current Node.js prefix.
- Gitignored `global/opencode.json` and `global/opencode.local.instructions.md`, loaded only by new OpenCode processes.
- One focused repository proof helper and its project-native validation coverage.
- Local interactive Windows screen, foreground-window focus, mouse, keyboard, clipboard for long input, and optional Nuphus-managed Chrome profile during later authorized use.
- Optional local OCR/YOLO model cache under `%APPDATA%\Nuphus\models` if perception is exercised.
- No public API, remote endpoint, portable default, persisted product data, target repository, commit, push, release, or deployment change.
