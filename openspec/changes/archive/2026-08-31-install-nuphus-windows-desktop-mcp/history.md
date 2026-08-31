# Strategy History

## 2026-08-30 - Build A Custom UI Automation Or Desktop Driver

- **Objective:** Give OpenCode direct Windows observation and input through a repository-owned implementation.
- **Approach:** Build a new UI Automation, screenshot, mouse, and keyboard MCP or adapt a broader desktop-agent framework such as UFO2/OpenAdapt.
- **Evidence:** The requested Nuphus repository already exposes the needed local stdio MCP surface and publishes a Windows x64 package. A custom driver would add protocol, capture, targeting, packaging, concurrency, update, and security ownership without a requirement unique to this workstation.
- **Outcome:** Rejected for this increment.
- **Reason:** It is a larger mechanism with more unproved owners than installing and bounding the selected upstream MCP.
- **Do Not Repeat:** Do not start a custom UIA/MCP implementation merely to avoid validating Nuphus's current observable contract.
- **Evidence-Based Retry Condition:** Reconsider only if the pinned candidate cannot satisfy a current requirement at the real boundary, or a current material security/compatibility finding is not containable without replacing it.

## 2026-08-30 - Install Pinned Nuphus As A Machine-Local Stdio MCP

- **Objective:** Let the active OpenCode primary agent observe and operate the current Windows desktop with the least new local machinery.
- **Approach:** Install `@nuphus/nuphus-mcp@0.2.2` and its matching Windows x64 package in the current global npm prefix, then add one `nuphus` stdio entry to the gitignored local OpenCode config.
- **Evidence:** Read-only npm/source/release inspection found the exact meta/platform package relationship, command launcher, 38-tool surface, Windows x64 build, successful release workflow, MIT license, and no current package/command/config collision. The operator selected this repository and granted full local authority.
- **Outcome:** Selected for planning.
- **Reason:** It extends the existing machine-local configuration owner, keeps the candidate exact and reversible, and avoids creating a remote service, portable default, second vision provider, or custom automation stack.
- **Do Not Repeat:** Do not replace the exact package with floating `npx`, latest, a raw executable, a remote MCP, or portable automatic installation during this change.
- **Evidence-Based Retry Condition:** Re-evaluate only if immediate pre-install identity differs, installation/protocol proof fails, or a current protected-boundary finding requires a different package or deployment model.

## 2026-08-30 - Require Nuphus Strict-Confirm Arguments

- **Objective:** Reduce accidental desktop writes by requiring `confirm: true` on every write operation.
- **Approach:** Start Nuphus with strict-write confirmation enabled and teach the agent to supply confirmation arguments.
- **Evidence:** The operator explicitly replied `полномочия полные`. Nuphus strict confirmation is a caller-supplied boolean rather than an independent human authorization event, while the active OpenCode instructions already retain protected owner boundaries.
- **Outcome:** Rejected for this increment.
- **Reason:** The flag would add repeated mechanical friction without providing the owner approval boundary its name implies, and it conflicts with the selected full-authority operating mode.
- **Do Not Repeat:** Do not reintroduce strict-confirm as a proxy for authorization or ask for per-action approval inside the accepted local envelope.
- **Evidence-Based Retry Condition:** Reconsider only if the operator changes the authority choice or a future Nuphus release provides a real external approval mechanism that a separately accepted requirement selects.

## 2026-08-30 - Treat Inline Screenshot Base64 As Model-Visible Pixels

- **Objective:** Use `desktop_screenshot` directly as the screen observation oracle.
- **Approach:** Accept the MCP tool's returned JSON/base64 text as if the primary model had visually inspected an image.
- **Evidence:** Source inspection of Nuphus `0.2.2` found that tool output is wrapped as MCP text rather than image content. A success response or base64 string does not establish that OpenCode's model decoded and saw the pixels.
- **Outcome:** Rejected.
- **Reason:** It is a proxy observation that can make false visual-success claims.
- **Do Not Repeat:** Do not cite the screenshot RPC, base64 length, file creation, or an input RPC as proof of visible desktop state.
- **Evidence-Based Retry Condition:** Reconsider only after a pinned Nuphus/OpenCode candidate emits and loads a verified MCP image content item through the actual active tool route.

## 2026-08-30 - Use Local Perception Plus Screenshot-To-Read

- **Objective:** Give the model coordinate data and direct pixel inspection without a second cloud vision route.
- **Approach:** Prefer `desktop_perceive` for local OCR/icon coordinates; when pixels matter, save a unique temporary PNG and inspect it through OpenCode Read, then act and obtain a fresh observation.
- **Evidence:** The selected package exposes local perception and screenshot-to-file operations. OpenCode Read accepts image files through the active model route, while Nuphus cloud vision would add a credential/provider/cost/privacy surface that the outcome does not require.
- **Outcome:** Selected for planning.
- **Reason:** It is the smallest sufficient model-visible observation path and preserves an observable act-confirm oracle.
- **Do Not Repeat:** Do not configure `desktop_vision`, persist screenshots, or fall back to guessed/stale coordinates when perception or Read fails.
- **Evidence-Based Retry Condition:** Change the route only if the real screenshot-to-Read or local-perception boundary fails with current retained diagnostics and another route is demonstrably smaller or safer.

## 2026-08-30 - Add Nuphus To Portable Defaults Or The Shared MCP Installer

- **Objective:** Make desktop control automatically available wherever the kit is installed.
- **Approach:** Add the Nuphus command to `global/opencode.json.template`, generated profiles, `setup:global`, or `tools/install-code-intelligence-mcps.ts`.
- **Evidence:** The tool grants high-authority host GUI access, is Windows/platform-specific for this claim, and the request concerns this machine. Existing shared installer ownership is portable code intelligence rather than user-desktop operation.
- **Outcome:** Rejected.
- **Reason:** It would silently widen installation, platform, authority, and context surface for unrelated users and projects.
- **Do Not Repeat:** Do not modify portable templates/profiles/shared installers to make this machine-local capability appear universal.
- **Evidence-Based Retry Condition:** Reconsider only under a separate portable-workstation requirement with explicit platform/authority UX, installation, compatibility population, and rollback proof.

## 2026-08-30 - Prove Through A Fresh Attributed Notepad Instance

- **Objective:** Demonstrate the complete see-target-act-confirm outcome without risking user-owned windows.
- **Approach:** Start a proof-owned OpenCode process and proof-owned Notepad, record PID/HWND/title, inspect a saved PNG, enter a unique non-sensitive marker, observe the marker, and clean only the recorded proof identities.
- **Evidence:** MCP connection or a successful input call does not prove the target visible effect. An existing window lacks safe ownership and cleanup attribution; a newly launched local Notepad gives a reversible current-machine boundary with a direct oracle.
- **Outcome:** Selected for apply tasks.
- **Reason:** It is the smallest complete real GUI proof that preserves unrelated processes and permits exact cleanup.
- **Do Not Repeat:** Do not prove against an existing user application, kill by executable name, or accept the input result without a post-action observation.
- **Evidence-Based Retry Condition:** Re-evaluate the proof application only if current Notepad process/window attribution cannot be made reliable and another proof-owned local application offers a smaller observable boundary.

## 2026-08-30 - Specialist Team Advice Unavailable

- **Objective:** Select the smallest sufficient maintained specialist map before Material planning.
- **Approach:** Dispatch the registered `specialist-team-advisor` after read-only foraging and before planning mutation.
- **Evidence:** Call `call_caf3b3c77902`, child session `session_b2196efe60a7`, completed with `Team Advice: unknown` because `specialist_catalog` was unavailable. No specialist work package was accepted from that return. Main independently retained the matched OpenSpec, change-ready, documentation, configuration, instruction-artifact, readiness-review, and later SDET routes required by current instructions.
- **Outcome:** Unknown advisory topology; planning continued under main's mandatory route ownership.
- **Reason:** Missing catalog prevents a trustworthy `main-alone` or conditional-package recommendation but does not remove exact independently matched Practice Owners.
- **Do Not Repeat:** Do not reinterpret unavailable catalog as `main-alone`, copy a static roster, or reconsult solely because planning advanced.
- **Evidence-Based Retry Condition:** Reconsult once only if `specialist_catalog` becomes available or the outcome, candidate, integration boundary, ownership, or required capability materially changes before apply dispatch.

## 2026-08-30 - Bounded Falsification Correction: Attribute The Proof Server

- **Objective:** Falsify planning candidate `install-nuphus-planning-r1` against the independent owner request and current workstation lifecycle before representing it as implementation-ready.
- **Approach:** Fresh read-only `implementation-readiness-reviewer` session `ses_fab8df883ffeH4RnahQwQ1Upzg` inspected the exact proposal/design/spec/tasks/history blobs and current capability/config/proof owners. Main then independently compared its material row with the current 4096/4097 capability, active MCP entries, and existing proof-environment helper.
- **Evidence:** Reviewer Effective Model `xai/grok-4.6` reported `IR-001`: the candidate required both the actual active config and an isolated new OpenCode process but did not name port, DB/XDG, config digest, sibling MCP handling, or server/client identity. Main confirmed `openspec/specs/local-opencode-workstation/spec.md` owns managed OpenCode/Graphify on 4096/4097, `global/opencode.json` enables three sibling MCPs, `tasks.md` previously named no isolating identities, and `tools/proofs/lib/opencode-proof-client.ts` already provides configured isolated DB/XDG environments.
- **Outcome:** Confirmed material implementation-readiness gap; corrected in planning candidate r2.
- **Reason:** Without explicit attribution, `nuphus connected` could come from a copied config, collide with or attach to the managed server, duplicate sibling MCP processes, or leave cleanup ownership ambiguous.
- **Correction:** Reuse the existing configured proof environment; allocate an ephemeral loopback port and isolated DB/XDG/test-home/project roots; point at and hash the actual active custom config; overlay only sibling-MCP disable flags without defining Nuphus; compare the resolved Nuphus entry and managed 4096/4097 identities; bind every request and cleanup record to the proof server's exact base URL/PID tree. Apply the identical route to rollback absence proof.
- **Do Not Repeat:** Do not use an unqualified `new OpenCode process`, attach to/restart 4096, copy a standalone Nuphus config, or start all active sibling MCPs to prove this capability.
- **Evidence-Based Retry Condition:** Revisit this decision only if implementation disproves config-overlay composition or the existing isolation owner cannot preserve the active Nuphus entry while disabling siblings; retain the same attribution invariants through any replacement route.

## 2026-08-30 - Corrected-Candidate Falsification Closed

- **Objective:** Re-challenge only the corrected proof-isolation decision surface and dependent consistency in planning candidate `install-nuphus-planning-r2`.
- **Approach:** Fresh read-only `implementation-readiness-reviewer` session `ses_fab85cc8fffet939YIMXRLcjTc` received the original request independently, the exact corrected blobs, prior `IR-001`, main's reproduction, and the bounded correction.
- **Evidence:** Effective Model `xai/grok-4.6` returned `no-material-finding`. It confirmed proposal, design, delta spec, tasks, and history consistently bind the ephemeral port, isolated mutable runtime roots, active-config digest, sibling-disable overlay without a Nuphus definition, exact PID/base URL, unchanged managed 4096/4097 identities, real screenshot/Notepad oracle, and identical rollback absence route. Strict OpenSpec validation was green before dispatch.
- **Outcome:** Bounded falsification is terminal for this planning decision surface; apply remains unstarted and all live package/protocol/OpenCode/GUI observations remain unknown.
- **Reason:** The one confirmed planning gap is corrected without adding an owner decision or expanding the accepted capability.
- **Do Not Repeat:** Do not request another generic planning review for this unchanged candidate or convert the review into live success evidence.
- **Evidence-Based Retry Condition:** A new readiness review is justified only after a material change to accepted outcome, proof identity, config composition, authorization, rollback, or observable oracle; implementation findings follow apply's production/review/SDET gates instead.

## 2026-08-31 - Loaded Tool Discovery Uses Observed IDs

- **Objective:** Prove the active-config Nuphus entry through one isolated OpenCode server and a bounded configured-provider screen-size request.
- **Approach:** Loaded attempt `nuphus-apply-r1-loaded` waited for `nuphus connected`, then filtered `client.tool.ids()` using the assumed `nuphus_` prefix before creating a session.
- **Evidence:** `evidence/loaded-r1/raw.json` preserves connected Nuphus status, disabled siblings, active/resolved config binding, ephemeral server PID/port, unchanged managed listeners, privacy-safe logs, terminal server status, and removed fixture. It failed with `Loaded OpenCode did not expose the Nuphus screen-size tool`; no session, provider call, screenshot, or input occurred. `evidence/loaded-r1-replay` reproduced the terminal failed evaluation with zero live calls. Installed SDK declarations state that `tool.ids` includes dynamically registered tools, so the endpoint is valid and only the prefix assumption was unsupported.
- **Outcome:** The first loaded attempt is closed and non-reusable; task 3.1 remains incomplete.
- **Reason:** The proof runner discarded valid IDs that did not match its guessed server-name prefix and failed before retaining the actual ID population or process tree.
- **Correction:** Preserve the complete privacy-safe observed ID list, select exactly one tool by normalized `desktop_screen_size` suffix, and capture the proof PID tree before the provider request. Keep the same active-config, overlay, isolation, managed-port, one-tool, and cleanup boundaries.
- **Do Not Repeat:** Do not infer loaded MCP tool names from the config key or retry the unchanged prefix filter.
- **Evidence-Based Retry Condition:** One new loaded attempt is allowed only with the corrected observed-ID selector and pre-provider process capture; another discovery failure requires retaining the full ID list and offline replay before any further provider attempt.

## 2026-08-31 - Provider-Aware Loaded Tool Discovery

- **Objective:** Resolve the loaded screen-size tool from OpenCode's actual provider/model-aware tool population without guessing a server prefix.
- **Approach:** Corrected loaded attempt `nuphus-apply-r2-loaded` preserved every `/experimental/tool/ids` result and selected by normalized `desktop_screen_size` suffix before any provider request.
- **Evidence:** `evidence/loaded-r2/raw.json` records only 14 built-in IDs from that endpoint while Nuphus status is `connected`; it also records one attributed Nuphus process, zero sibling MCP processes, no confirmation argument, unchanged managed listeners, terminal server cleanup, removed fixture, and zero screenshot/input/provider effects. `evidence/loaded-r2-replay` reproduced the terminal failed evaluation with zero live calls. The installed v2 SDK separately defines `client.tool.list({ provider, model })` as the provider/model-aware route returning available tool IDs and JSON schemas.
- **Outcome:** The second loaded attempt is closed and non-reusable; task 3.1 remains incomplete, but process attribution and sibling suppression are now proven on the active candidate.
- **Reason:** On OpenCode 1.18.25, `/experimental/tool/ids` did not include connected MCP tools in this isolated route despite its generated description; filtering that population cannot discover Nuphus.
- **Correction:** Query `client.tool.list` with the active configured provider/model, preserve its ID population, select exactly one normalized `desktop_screen_size` suffix, and use the union of built-in and provider-aware IDs to expose only that tool to the bounded prompt.
- **Do Not Repeat:** Do not retry another naming filter over `/experimental/tool/ids` or infer success from `mcp.status` alone.
- **Evidence-Based Retry Condition:** One new loaded attempt is allowed only through the provider/model-aware list route; another discovery failure requires offline replay and source/runtime diagnosis of that exact endpoint before any provider request.

## 2026-08-31 - Session Merge Owns MCP Tool Exposure

- **Objective:** Determine why connected Nuphus tools are absent from both experimental inventory endpoints and select the exact session tool without another naming guess.
- **Approach:** Loaded attempt `nuphus-apply-r3-loaded` queried provider/model-aware `client.tool.list` after connected status and before any provider request.
- **Evidence:** `evidence/loaded-r3/raw.json` records only 11 registry/built-in IDs from the list endpoint, while Nuphus remains connected with one attributed process, zero siblings, no confirmation argument, unchanged managed listeners, terminal server cleanup, and no provider/screenshot/input effect. `evidence/loaded-r3-replay` reproduced that terminal result offline. Current OpenCode source `packages/opencode/src/mcp/catalog.ts` defines `toolName(clientName, name)` as `sanitize(clientName) + "_" + sanitize(name)`, yielding exact ID `nuphus_desktop_screen_size`; `packages/opencode/src/mcp/index.ts` exposes cached connected definitions through `MCP.tools()` for session composition.
- **Outcome:** The third loaded attempt is closed and non-reusable; task 3.1 remains incomplete, with exact canonical screen-tool naming now source-proven.
- **Reason:** Experimental tool inventory routes do not include MCP session tools in this OpenCode 1.18.25 runtime path even though MCP status and cached server definitions are live; treating either endpoint as a precondition prevents the session merge that actually exposes MCP tools.
- **Correction:** Retain both endpoint populations as diagnostics, set only the source-proven `nuphus_desktop_screen_size` tool to true in the session request, and let the real prompt path compose connected MCP tools. Require the returned tool-call part and dimensions as the runtime oracle.
- **Do Not Repeat:** Do not gate MCP session execution on `/experimental/tool/ids` or `/experimental/tool` containing MCP IDs.
- **Evidence-Based Retry Condition:** One new loaded attempt is allowed only through direct source-proven session composition; any failure after session creation must be replayed and diagnosed from provider/tool-call evidence before another live request.

## 2026-08-31 - Read Tool Calls From The Session Transcript

- **Objective:** Complete the configured-provider screen-size oracle after source-proven session composition reached the model.
- **Approach:** Loaded attempt `nuphus-apply-r4-loaded` enabled only canonical `nuphus_desktop_screen_size`, invoked the configured `openai/gpt-5.6-sol` route, and evaluated the direct `session.prompt` response as if it contained the whole tool-call sequence.
- **Evidence:** `evidence/loaded-r4/raw.json` records final assistant text `2520x1680`, correct configured model identity, connected/attributed Nuphus, disabled siblings, unchanged managed listeners, deleted session, terminal server, removed fixture, and no screenshot/input. Its direct response projection contains no tool part, so the evaluator failed; `evidence/loaded-r4-replay` reproduced that terminal result offline. Existing repository proof owners read intermediate tool parts through `client.session.messages(...)`, demonstrating that the direct prompt result is only the final assistant turn.
- **Outcome:** The fourth loaded attempt is closed and non-reusable; task 3.1 remains incomplete only because the transcript tool-call observation was not retained.
- **Reason:** The evaluator inspected the final response envelope rather than the complete session transcript and therefore discarded the intermediate completed MCP call that produced the exact returned dimensions.
- **Correction:** Read the bounded session transcript before deletion and retain only matching tool name, status, output byte/hash, and parsed dimensions. Require exactly one completed call and final text equal to its `WIDTHxHEIGHT` result.
- **Do Not Repeat:** Do not infer that a missing tool part in the final `session.prompt` response means the MCP tool was not called.
- **Evidence-Based Retry Condition:** One new loaded attempt is allowed only with transcript readback and the unchanged one-tool prompt; any further failure requires replay and diagnosis of the retained transcript projection before another provider request.
- **Terminal Evidence:** `evidence/loaded-r5/raw.json` and `evidence/loaded-r5-replay` pass with one completed `nuphus_desktop_screen_size` transcript call returning 2520x1680, matching final text, configured model identity, attributed process tree, unchanged managed listeners, deleted session, terminal server, removed fixture, and zero screenshot/input effects.

## 2026-08-31 - Local Perception Bootstrap Degraded

- **Objective:** Exercise `desktop_perceive` once against an attributed proof-owned Notepad marker while retaining local model and cleanup evidence.
- **Approach:** Attempt `nuphus-perceive-r1` removed cloud-vision variables, launched a unique Notepad fixture, captured its window PNG, invoked local perception once, inventoried the model cache before and after, then closed only the attributed PID and removed the fixture.
- **Evidence:** `evidence/perceive-r1/raw.json` records two downloaded ONNX files and hashes, then a cause-preserving failure downloading `ch_PP-OCR_keys_v1.txt`; `evidence/perceive-r1-source-urls.json` binds exact URLs to upstream v0.2.2 source; `evidence/perceive-r1-replay/evaluation.json` passes offline after correcting the path-token evaluator shape.
- **Outcome:** Terminal degraded result accepted by task 3.3. Local OCR was unavailable because its required three-file set was incomplete; icon detection was unavailable because perception stopped at the OCR prerequisite. No cloud-vision credential/request existed, screenshot-to-Read remained sufficient, and all proof processes/files were cleaned.
- **Do Not Repeat:** Do not invoke `desktop_perceive` again with the same network/model-cache condition merely to seek a green local OCR result.
- **Evidence-Based Retry Condition:** A task requiring local OCR coordinates rather than the accepted screenshot-to-Read fallback, plus evidence that the dictionary source/network route changed or the exact missing dictionary was supplied and hashed.

## 2026-08-31 - Rollback Rehearsal And Deterministic Restore

- **Objective:** Prove that the installed candidate can be removed and restored without touching unrelated machine or repository state.
- **Approach:** Verify exact config/instruction/package/binary/shim identities, remove only the two Nuphus blocks, normalize the recorded CRLF rollback preimage, uninstall only the two preverified package names, run the isolated provider-free `absent` mode, then restore the reviewed semantics, exact packages, and isolated configured-provider screen-size proof.
- **Evidence:** `evidence/rollback-r1-absent` and its final replay pass with baseline config/instruction hashes, absent package/command/status/process, unchanged model inventory and managed listeners, zero provider/screen effects, and terminal cleanup. `evidence/restore-r2-config` proves one exact block per file and byte-exact rollback to both original preimages. `evidence/restore-r1-loaded` and final replay pass with the original package/binary/shim, connected attributed Nuphus, 2520x1680, unchanged managed listeners, and terminal cleanup. `tools/test-nuphus-desktop.ts` proves drift rejects deletion.
- **Outcome:** Rollback and restored installed candidate pass. The instruction block was normalized to deterministic CRLF (`2542b70c3af76fa24a9f0a99a8621b51b2c329cbf750bc3bc04c05e38d4795f1`) because the prior mixed-line-ending candidate bytes were not recoverable from retained evidence; exact removal still restores the original `2ede867e...` preimage.
- **Do Not Repeat:** Do not use version-qualified specs with `npm uninstall` on this npm runtime; it was a no-op. Do not use a broad config patch anchor or ignore a changed protected-file reference.
- **Evidence-Based Retry Condition:** Repeat only after package/config/instruction identity changes, or if a future rollback requirement selects removal of the retained local model cache.

## 2026-08-31 - Installed Candidate Practice Reviews And Critical SDET

- **Objective:** Challenge the restored installed candidate for instruction/configuration defects and reachable wrong-window, privacy, rollback-drift, or cleanup incidents.
- **Approach:** Fresh instruction and configuration Practice Owners inspected the exact installed candidate in parallel; main reproduced each instruction row, applied only the smallest existing-block correction, repeated loaded and attributed Notepad proof, then dispatched one fresh test-only SDET.
- **Evidence:** Instruction reviewer task `ses_fab233a6fffeFZCyKAHoik5nQP` reported IA-NUPHUS-001 through IA-NUPHUS-003. Main confirmed all three: unconditional perception preference conflicted with the terminal degraded cache, `desktop_vision` lacked a stay-quiet, and generic screenshot wording could expose unrelated desktop pixels. Active instructions and their proof mirror now require identified-window/region capture, forbid unrelated full-desktop Read, gate perception on complete local OCR, prohibit unchanged retry/guessed coordinates, and prohibit `desktop_vision`. Configuration reviewer task `ses_fab233a49ffeG0I4z5qk6WcLYW` returned `no-material-finding`. Corrected `evidence/instruction-fix-r1-config`, `evidence/instruction-fix-r1-loaded`, Notepad-r2 visual/cleanup bundles, and their replays pass. Fresh SDET task `ses_fab14cc9effeKX4vXacIFa2wu2` returned `no-critical-risk`, extended stale-identity negatives, and `node --test tools/test-nuphus-desktop.ts` passed 6/6.
- **Outcome:** Review findings are closed on instruction hash `b9344b78a13027621595222f05f3c554819100b3ba53c1fdc69e0b777455b739`. Corrected task 3.1 and 3.2 live proofs pass. Task 3.3 remains honestly degraded and was revalidated by unchanged two-file cache hashes plus offline replay; no prohibited unchanged live perception retry occurred.
- **Do Not Repeat:** Do not rerun the generic reviewers, SDET, or degraded perception on this unchanged candidate merely for confidence.
- **Evidence-Based Retry Condition:** A material instruction/config/package/proof mutation, a main-confirmed critical defect and correction, or new evidence for a distinct reachable critical incident.

## 2026-08-31 - UI Positioning Config Capture Failures

### Attempt `ui-positioning-r1-config`

- **Objective:** Prove the new explicit UI-development/debugging positioning through the existing exact-block config owner without starting Nuphus or a GUI process.
- **Approach:** Add the positioning line to the machine-local instruction and its proof mirror, then run config mode against the last accepted instruction/config evidence.
- **Evidence:** `evidence/ui-positioning-r1-config/raw.json` retained the cause-preserving `Current files do not contain the exact Nuphus instruction block` failure with `privacySafe: true`; the focused instruction regression passed 7/7 separately.
- **Outcome:** Evaluator failure before configuration readback. `apply_patch` introduced one LF line into the otherwise CRLF machine-local instruction, so neither the all-LF nor all-CRLF exact block matched.
- **Do Not Repeat:** Do not rerun exact-block capture against mixed line endings or weaken exact-block matching to accept an unreviewed byte sequence.
- **Evidence-Based Retry Condition:** Restore the changed machine-local instruction to deterministic CRLF and verify zero bare LF before a new create-only capture. This condition was satisfied before `ui-positioning-r2-config`.

### Attempt `ui-positioning-r2-config`

- **Objective:** Re-run the same provider-free instruction/config oracle after byte-format correction.
- **Approach:** Normalize only the already changed instruction file to CRLF, then capture against the prior accepted reference bundle.
- **Evidence:** `evidence/ui-positioning-r2-config/raw.json` and `evaluation.json` show exact insertions, official/source readback, privacy, and rollback preimages passing. The independent protected-template check reports current `global/opencode.json.template` hash `0a0ad271...` versus prior reference `a6f3cf60...`; the installer reference remains unchanged.
- **Outcome:** The new instruction behavior and exact rollback pass, but aggregate config proof remains failed because an unrelated protected template changed concurrently outside this change's owner.
- **Do Not Repeat:** Do not ignore the protected-file mismatch, overwrite the unrelated template, or reuse the stale `a6f3cf60...` reference.
- **Evidence-Based Retry Condition:** Use the retained r2 current-template identity as the explicit reference input and rerun only if the current template still matches `0a0ad271...`; any further drift blocks again.

## 2026-08-31 - UI Positioning Accepted Candidate

- **Objective:** Make Nuphus an explicit globally loaded route for visible-state UI development/debugging without duplicating policy or weakening non-visual evidence and desktop-safety boundaries.
- **Approach:** Keep one positioning bullet in `global/opencode.local.instructions.md`, mirror its exact rollback block in the existing proof owner, require both source and mirror in the focused regression, use `ui-positioning-r2-config` as the explicit protected-template reference for a fail-closed r3 capture, and resolve the active config from this repository plus two unrelated projects with a case-sensitive privacy-safe projection.
- **Evidence:** `node --test tools/test-nuphus-desktop.ts` passed 7/7. `evidence/ui-positioning-r3-config` passes exact insertion, official/source readback, privacy, protected-file, and rollback checks. `evidence/ui-positioning-r1-cross-project.json` records the same enabled Nuphus projection, exactly one canonical instruction, instruction SHA-256 `23c893ef557551e0e3e5f9600a967c941bd80eb77d45fa9a70ea85addeba4f5f`, UI positioning, and non-visual boundary in `opencode-kit`, `controller-gateway-service`, and `hmi-legacy`. Fresh instruction-artifact Practice Owner task `ses_faae959baffeUe3TZ351JO9r91` returned `no-material-finding`; disposition is retained in `evidence/ui-positioning-r1-review.json`.
- **Outcome:** Task 4.4 passes on the instruction/config boundary. Nuphus is explicitly positioned for visible UI development/debugging in every inspected project that uses the active custom source and command path. No live GUI, perception, package, or user-owned OpenCode restart occurred.
- **Do Not Repeat:** Do not duplicate the positioning across project, skill, or agent prompts; do not claim coverage for sessions using another config source or command path; do not repeat live GUI/perception proof for this instruction-only change.
- **Evidence-Based Retry Condition:** Repeat the affected config/cross-project/review lane only after a material change to the canonical positioning text, its loader path, Nuphus projection, or the accepted UI-routing semantics.

## 2026-08-31 - Apply Completion And Handoff

- **Objective:** Close project-native validation, bound all retained evidence, and hand off the exact installed identity and restart boundary without activating the user-owned session.
- **Approach:** Materialize one four-lane schema-v2 evidence index with a reviewed 160-file/1 MiB causal-retention exception, merge task evidence through the repository helper, run the complete task-5.1 validation set, re-read current package/config/instruction/model/process identities, and retain terminal validation and handoff records.
- **Evidence:** Apply gate passes with zero of 13 tasks unchecked; `openspec instructions apply` reports 13/13 and `all_done`; strict OpenSpec validation, `npm run validate:strict`, focused Nuphus tests 7/7, and portable-process tests 9/9 pass. Evidence inventory reports 137 files, 178910 bytes, 13 current task rows, zero unindexed/stale/mismatched/unknown rows, and no findings. Final privacy scan covers 151 scoped files with no secret, private evidence path, or image payload. `evidence/final-validation-r1.json` and `evidence/final-handoff-r1.json` preserve command dispositions, identities, rollback, limitations, privacy, effects, and cleanup.
- **Outcome:** All apply tasks are complete. The installed Nuphus package/config/runtime happy path and rollback remain proven; the new instruction-only positioning is proven through exact config readback, three-project loader projection, focused regression, and fresh Practice Owner `no-material-finding`. No proof-owned process/window/PNG remains. The normal user-owned OpenCode session has not been restarted.
- **Do Not Repeat:** Do not rerun live GUI/perception/provider proof, generic review, SDET, package install/uninstall, or rollback on this unchanged candidate merely for confidence.
- **Evidence-Based Retry Condition:** Reopen only after package/config/instruction/loader identity changes, a new reachable material defect is evidenced, or the owner explicitly requests archive or activation work.

## 2026-08-31 - Owner-Restarted Session Activation

- **Objective:** Confirm the normal owner-restarted OpenCode session, rather than an isolated proof process, loaded the installed Nuphus MCP before archive.
- **Approach:** Accept the owner's explicit restart report, then invoke only the current session's loaded `nuphus_desktop_screen_size` tool without desktop input or screen capture.
- **Evidence:** `evidence/restarted-session-r1.json` records current-session tool availability, result `2520x1680`, canonical instruction SHA-256 `23c893ef557551e0e3e5f9600a967c941bd80eb77d45fa9a70ea85addeba4f5f`, and zero input/capture/process effects.
- **Outcome:** The current owner-restarted OpenCode session has Nuphus loaded and responsive. The activation boundary in the final handoff is closed.
- **Do Not Repeat:** Do not add a screenshot, GUI input, provider call, or another restart merely to reconfirm the unchanged loaded session.
- **Evidence-Based Retry Condition:** Repeat only after the current session, Nuphus package/config, active custom source, command path, or canonical instruction identity changes.
