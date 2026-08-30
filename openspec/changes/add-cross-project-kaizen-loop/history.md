# Strategy History

## 2026-08-27 - Permanent Per-Project Improvement Spec

- **Objective**: Give every project an obvious durable place where agents can accumulate irritants and eventually implement them in batches.
- **Approach**: Keep one long-lived OpenSpec change or special spec in each project and route cross-project entries into a corresponding `opencode-kit` change.
- **Evidence**: OpenSpec changes require bounded outcomes, proof, tasks, and an archive boundary. A mixed evergreen backlog has no natural completion, combines unrelated owners and proof surfaces, increases writer conflicts, and cannot use entry count as implementation readiness.
- **Outcome**: Rejected.
- **Reason**: It turns a signal inbox into an unarchivable product change and repeats the capture-without-closure problem at a larger scope.
- **Do Not Repeat Until**: OpenSpec adds a separately governed durable issue-inbox primitive whose lifecycle is not a change lifecycle.
- **Evidence-Based Retry Condition**: A maintained OpenSpec store API proves append-only issue intake, independent per-outcome promotion, cross-project identity, and closure without keeping one active change open.

## 2026-08-27 - Mandatory Final Retrospective

- **Objective**: Guarantee that every completed task produces workflow-learning artifacts.
- **Approach**: Require a final retrospective, ledger update, and follow-up task before handoff or archive.
- **Evidence**: Repository history removed the earlier mandatory self-improving instruction loop and final retrospective because it added completion ceremony and optional work to the product graph. Current specs explicitly allow complete handoff/archive without final-history analysis.
- **Outcome**: Rejected.
- **Reason**: It blocks product completion on process output, encourages proxy compliance, and recreates a previously removed design.
- **Do Not Repeat Until**: The accepted product outcome itself requires a retrospective artifact rather than optional workflow learning.
- **Evidence-Based Retry Condition**: A concrete project requirement names the retrospective as delivered behavior with its own consumer and proof boundary.

## 2026-08-27 - Compaction-Only Reflection

- **Objective**: Reuse the existing compaction `Session Reflection` with no extra provider calls or completion-stage ceremony.
- **Approach**: Emit structured signals only during compaction and persist them afterward.
- **Evidence**: Compaction is valuable for long-running sessions but may never occur before a short task or OpenSpec change completes. It also requires a proven post-compaction summary identity before the plugin can persist only the signal envelope safely.
- **Outcome**: Rejected as the sole capture mechanism; retained as a first-class periodic lane.
- **Reason**: It leaves short completed changes and immediately recognized irritants uncovered.
- **Do Not Repeat Until**: Every supported task is guaranteed to compact before completion, which is neither current nor desirable behavior.
- **Evidence-Based Retry Condition**: Current OpenCode lifecycle evidence proves mandatory pre-completion compaction for the complete supported task population without extra cost or context damage.

## 2026-08-27 - Unified Local Inbox With Periodic And Terminal Harvest

- **Objective**: Preserve explicitly observed irritants across projects, capture long-session and completed-change reflections, and promote only cohesive evidence-backed work.
- **Approach**: Extend the existing loaded plugin with one machine-local append-only signal lifecycle; use explicit report, mandatory compaction envelope, and non-blocking archive checkpoint lanes; retarget `complain`; keep manual triage and proposal creation root-contained.
- **Evidence**: `session-env` already composes custom tools and hooks; project memory proves platform data-root, fixed-slot append, redaction, copied-plugin, and cross-process patterns; current plugin docs expose compaction events and session message lookup; canonical archive already separates deterministic movement from optional reflection; no new dependency or service is required.
- **Outcome**: Selected for proposal and implementation planning.
- **Reason**: It is the smallest design that closes the observed intake/continuity gap without a permanent spec, transcript store, remote service, autonomous writer, or product-completion gate.
- **Do Not Repeat Until**: N/A - selected strategy.
- **Evidence-Based Retry Condition**: Re-evaluate if task 1.2 disproves safe post-compaction summary correlation, fixed-slot global storage cannot meet the bounded population, or manual triage cannot create one contained proposal without cross-repository mutation.

## 2026-08-27 - Immediate Autonomous Cross-Project Campaign

- **Objective**: Drain the queue automatically and implement recurring fixes without operator initiation.
- **Approach**: Add a scheduler or connect intake directly to the planned autonomous campaign, allowing consumer sessions to launch or write into `opencode-kit`.
- **Evidence**: The active campaign design is not implemented, supports exactly one single-project audit-remediate playbook, excludes multi-repository transactions, and already has overlapping plugin/orchestration ownership. The current feedback population has not yet proved scheduler value, cadence, grouping, or safe worktree coordination.
- **Outcome**: Deferred outside the current increment.
- **Reason**: Capture, lifecycle, and one manual proposal path must work before a scheduler can be specified from observed queue behavior.
- **Do Not Repeat Until**: The installed inbox has current usage evidence and the campaign owner exposes a verified non-overlapping intake/playbook contract.
- **Evidence-Based Retry Condition**: At least one maintained population shows recurring pending work that manual triage cannot drain, and a current campaign proof supports the required root, writer-isolation, budget, and recovery semantics.

## 2026-08-29 - Acquire Isolated Kaizen Roots And Serialize Compaction Wording

- **Objective**: Begin Kaizen after the trajectory archive without racing the newly active grind-blocker change or unrelated dirty work.
- **Approach**: Acquire the new `global/plugin/kaizen/**`, status/triage, store, and proof roots now; retain the archived trajectory transfer as terminal; and declare a planning-only dependency that keeps `global/AGENTS.md` and `global/opencode.json.template` untouched until `make-grind-blockers-task-scoped` is terminal or records exact non-overlap.
- **Evidence**: `add-roadmap-delivery-trajectory-loop` is archived at `openspec/changes/archive/2026-08-29-add-roadmap-delivery-trajectory-loop`; its post-archive durable-source correction passed focused consumer-outcome and aggregate pre-push validation. `make-grind-blockers-task-scoped` appeared active at 0/12 with no ownership manifest and names future compaction/handoff instruction work. The unrelated campaign change and its dirty files remain outside this change.
- **Outcome**: Selected. Kaizen mutation is enabled only for declared isolated roots; shared compaction/handoff wording is serialized, and the task-1.2 live evidence gate remains unknown until bounded capture completes.
- **Reason**: This preserves the requested advisor, trajectory, Kaizen serial order while avoiding an unnecessary whole-change stall and preventing concurrent mutation of the only plausible shared instruction surface.
- **Do Not Repeat Until**: Do not mutate grind-blocker files, active gitignored `global/opencode.json`, unrelated campaign files, or shared compaction/handoff wording while the other writer is open. Do not infer that a missing ownership manifest means no writer exists.
- **Evidence-Based Retry Condition**: Reconcile ownership again before any shared prompt/instruction edit, or sooner if the active change list, ownership manifest, mutation flag, or write-root inventory changes.

## 2026-08-29 - Loaded Tools R1 Inline-Config Startup

- **Objective**: Prove task 1.4 through pinned OpenCode with a copied plugin and isolated local state.
- **Approach**: Supply the copied plugin and loopback provider through inline `OPENCODE_CONFIG_CONTENT`, start the proof server, then script report and status calls.
- **Evidence**: `evidence/loaded-tools-r1/bundle.json` reached only server startup. Copied/source plugin identities matched, but readiness timed out before session creation; no tool, store, or provider observation exists. The bundle preserved the failure and fixture/provider cleanup but did not preserve the helper-owned startup process terminal state or logs.
- **Outcome**: Rejected for unchanged repetition.
- **Reason**: The attempt did not distinguish inline-config loading from plugin startup failure and its runner omitted the startup-failure diagnostics already exposed by `proofServerStartupFailure`.
- **Do Not Repeat Until**: The runner captures startup diagnostics and terminal state, replays r1 offline, and uses a causally different configuration mechanism.
- **Evidence-Based Retry Condition**: An effect-free r1 replay classifies the failure, no proof-owned process remains, and isolated config-file loading replaces inline config for the next bounded attempt.

## 2026-08-29 - Loaded Tools R2 Config-File Startup

- **Objective**: Close task 1.4 without repeating the opaque r1 startup path.
- **Approach**: Use the existing proven `OPENCODE_CONFIG_DIR/opencode.json` mechanism with copied plugin dependencies, retain startup-failure logs and terminal state, and otherwise preserve the same disposable root, loopback-only provider, tool oracle, and cleanup envelope.
- **Evidence**: `evidence/loaded-tools-r2/bundle.json` preserved a clean terminal process and startup logs. OpenCode listened on loopback, entered project bootstrap, loaded the isolated config files, and then never made the readiness route responsive. No session, provider, tool, or store path was reached. An offline Bun import of the same current `session-env` completed and exposed all four Kaizen tools.
- **Outcome**: Rejected for unchanged repetition.
- **Reason**: Config-file loading improved diagnostics but retained the same forced default-plugin-disable environment present in r1; the stall remained before Product Candidate observation.
- **Do Not Repeat Until**: R2 is replayed offline, no proof-owned process remains, and the environment differs at the implicated plugin-loader control.
- **Evidence-Based Retry Condition**: The next attempt leaves `OPENCODE_DISABLE_DEFAULT_PLUGINS` unset, matching the repository's successful copied-plugin loaded harness and successful proof-server environment, while retaining r2 diagnostics and cleanup controls.

## 2026-08-29 - Loaded Tools R3 Standard Plugin Loader

- **Objective**: Reach the loaded copied-plugin tool boundary after two startup-only failures.
- **Approach**: Keep the isolated config file, copied plugin, loopback provider, and terminal diagnostics, but leave `OPENCODE_DISABLE_DEFAULT_PLUGINS` unset so OpenCode uses its standard explicit file-plugin loader.
- **Evidence**: R2 terminal replay classifies `proof-runner-or-environment-startup`; no proof-owned process remains. Direct Bun composition proves current plugin evaluation and server-hook construction terminate with report/status/decision/checkpoint present. The default-plugin-disable flag is the remaining material environment difference from proven loaded harnesses.
- **Outcome**: Selected.
- **Reason**: This changes the implicated plugin-loader mechanism rather than flags, timeout, wording, or retry count alone.
- **Do Not Repeat Until**: N/A - selected strategy.
- **Evidence-Based Retry Condition**: Re-evaluate only from retained r3 startup/tool diagnostics and its complete offline replay chain.

## 2026-08-29 - Loaded Tools R3 Rejected

- **Objective**: Determine whether the standard explicit file-plugin loader alone closes the startup gate.
- **Approach**: Replay r3 after leaving `OPENCODE_DISABLE_DEFAULT_PLUGINS` unset while retaining the isolated config file and copied plugin.
- **Evidence**: `evidence/loaded-tools-r3/bundle.json` again listened and stalled after config loading; replay reports `productCandidateReached=false`, `providerReached=false`, and `classification=proof-runner-or-environment-startup`. A direct Bun import still exposed all four Kaizen tools.
- **Outcome**: Rejected.
- **Reason**: The loader-flag change did not leave the same startup-only failure chain.
- **Do Not Repeat Until**: Ordered wrapper module/import/factory phases and the maintained dual runtime-root topology identify a different boundary.
- **Evidence-Based Retry Condition**: Both plugin-only and provider-added no-model config phases complete through source factory exit with zero provider requests and trapped egress.

## 2026-08-29 - Dual-Root Traced Preflight

- **Objective**: Close the r1-r3 plugin-runtime observation gap without another server/model attempt.
- **Approach**: Port the maintained dual config-root dependency seeding, dynamic traced plugin wrapper, and staged `opencode debug config` preflights into the Kaizen runner.
- **Evidence**: `evidence/loaded-tools-preflight-r1/bundle.json` passed plugin-only and provider-added phases through wrapper module enter, source import exit, source factory exit, and factory exit. Copied/source plugin digests match; both runtime roots are pinned to plugin/SDK 1.18.15; provider requests and trapped egress are zero.
- **Outcome**: Accepted.
- **Reason**: The offline/no-model gate proves config resolution and copied-plugin construction complete and provides exact ordered diagnostics for a bounded loaded capture.
- **Do Not Repeat Until**: N/A - accepted strategy.
- **Evidence-Based Retry Condition**: Any later loaded capture must preserve these two green phases and the traced dual-root topology.

## 2026-08-29 - Loaded Tools R4 Oracle Failure

- **Objective**: Execute `kaizen_report` then `kaizen_status` through pinned OpenCode and retain bounded loaded evidence.
- **Approach**: Use the accepted dual-root traced topology, copied plugin, disposable roots, isolated data/config/database, and scripted loopback provider.
- **Evidence**: `evidence/loaded-tools-r4/bundle.json` reached the product candidate, advertised all four tools, completed report/status, persisted and read back one bounded immutable record, made exactly three provider calls, trapped no egress, and completed session/server/provider/root cleanup. Only `privacySafe` and `statusPayloadFree` failed. Source inspection proves status intentionally projects `scopeHint`; replay classifies `proof-runner-oracle` because the runner treated the public fixture value `scopeHint=opencode-kit` as forbidden signal text.
- **Outcome**: Rejected as final proof; product behavior accepted for the exercised boundary.
- **Reason**: The raw invocation is finalized, but its overbroad privacy oracle cannot be recomputed from the deliberately payload-free retained projection.
- **Do Not Repeat Until**: The oracle forbids only absolute/private roots and actual signal text fields, focused tests and strict OpenSpec validation pass, r4 replay remains classified as a proof-runner oracle, and no proof-owned process remains.
- **Evidence-Based Retry Condition**: One new bounded capture may run after those conditions; no unchanged oracle or startup mechanism may be retried.

## 2026-08-29 - Loaded Tools R5 Accepted

- **Objective**: Close task 1.4 through the corrected privacy oracle and pinned loaded entry point.
- **Approach**: Preserve the accepted dual-root traced preflights and r4 product path, but classify only absolute/private roots and signal text fields as forbidden; keep `scopeHint` as intentional operational status metadata.
- **Evidence**: `evidence/loaded-tools-r5/bundle.json` passed every check. Pinned OpenCode 1.18.25 loaded the byte-matched copied plugin, advertised all four tools, completed report/status through exactly three scripted provider calls, persisted one 1,058-byte immutable signal, returned privacy-safe metadata without signal text, trapped no egress, kept the worktree clean, and completed session/server/provider/root cleanup. Focused tests, r4 replay, and strict OpenSpec validation passed before capture.
- **Outcome**: Accepted for task 1.4 and finite-population member `enabled-explicit-valid` only.
- **Reason**: The candidate reached the real loaded boundary with representative input and direct readback while retaining bounded diagnostics, effects, identities, and cleanup.
- **Do Not Repeat Until**: Product source, loaded runner topology, privacy oracle, pinned OpenCode identity, or the exercised requirement changes.
- **Evidence-Based Retry Condition**: Re-run only after such a material change; do not use this slice as archive, compaction, triage, proposal, or complete-population proof.

## 2026-08-29 - Archive Boundary R1 Shared Project Oracle

- **Objective**: Exercise the canonical archive helper and agent-owned harvest checkpoint around disposable successful, interrupted, unavailable, and failed archive paths.
- **Approach**: Use one isolated Kaizen data root and five disposable OpenSpec projects, open checkpoints before helper invocation, and close them only after observing helper status.
- **Evidence**: `evidence/archive-boundary-r1/bundle.json` reached all five helper paths and completed cleanup, but every project used the same leaf name. The cross-project inbox therefore grouped their records under one canonical project reference and made the no-signal oracle false.
- **Outcome**: Rejected as final proof; no Product Candidate defect inferred.
- **Reason**: The runner failed to give the scenarios distinct project identities.
- **Do Not Repeat Until**: Every disposable scenario uses a distinct project leaf name.
- **Evidence-Based Retry Condition**: A new run preserves the same production/helper path with unique canonical project identities.

## 2026-08-29 - Archive Boundary R2 Global Inbox Oracle

- **Objective**: Re-run the archive matrix with distinct project identities and stronger empty/failed/repair assertions.
- **Approach**: Keep the real helper and checkpoint path but count archive-source records in the global status inbox.
- **Evidence**: `evidence/archive-boundary-r2/bundle.json` again reached all five helper paths and completed cleanup. Captured checkpoints exposed one signal ref while no-signal, repair, and failed checkpoints exposed zero; the runner nevertheless rejected them because it counted the intentionally cross-project global inbox.
- **Outcome**: Rejected as final proof; no Product Candidate defect inferred.
- **Reason**: The oracle used global inbox totals instead of the checkpoint's exact `signalRefs` ownership boundary.
- **Do Not Repeat Until**: The oracle resolves only signal refs owned by the checkpoint under test.
- **Evidence-Based Retry Condition**: A new run retains global counts only as diagnostics and judges findings exclusively from checkpoint signal refs.

## 2026-08-29 - Archive Boundary R3 Accepted

- **Objective**: Close task 2.2 at the canonical helper and durable checkpoint boundary without archiving the active Kaizen change.
- **Approach**: Run five distinct disposable OpenSpec roots through the canonical deterministic helper and production checkpoint tool; derive interruption as report-only `repair-gap`, then repair only its still-open checkpoint.
- **Evidence**: `evidence/archive-boundary-r3/bundle.json` passed every check. Captured findings closed with one archive-source ref; empty success and repaired interruption closed `no-signal` with zero refs; disabled harvest remained non-persisted `unavailable`; failed pre-archive validation closed `archive-failed`. Successful changes moved exactly once, repair did not modify the archive, provider calls were zero, active config stayed unchanged, and every fixture was removed.
- **Outcome**: Accepted for task 2.2 and its five direct archive members; it is not complete `KZN-001` loaded-population proof.
- **Reason**: The exercised helper remains the sole archive authority while the agent-owned checkpoint records only harvest state and bounded findings.
- **Do Not Repeat Until**: Production checkpoint/store behavior, archive skill ordering, helper behavior, or the maintained archive oracle changes.
- **Evidence-Based Retry Condition**: Re-run only after such a material change or as part of the final complete installed `KZN-001` proof.

## 2026-08-29 - Complain And Legacy Import R1 Accepted

- **Objective**: Make the loaded Kaizen inbox the single live complaint lifecycle while retaining one bounded Markdown degraded path and strict idempotent legacy import.
- **Approach**: Add one exact maintained-entry parser and loaded import tool under the existing Kaizen owner; route `complain` to `kaizen_report` when advertised; reserve Markdown for pre-persistence unavailability; and keep ambiguous inbox failures no-write.
- **Evidence**: `evidence/task-2-3-complain-r1.md` records the current source identity and provider-free copied-plugin proof. Nineteen focused Kaizen tests and 72 workflow contracts passed; strict OpenSpec validation passed. The copied plugin executed explicit report and legacy import with no feedback-ledger write; replay deduplicated by project plus `FB-*`, written status remained evidence only, and explicit triage recorded `needs-investigation`. A scoped instruction review found two dual-write/duplicate ambiguities; main corrected both and the corrected-candidate re-review returned no material finding.
- **Outcome**: Accepted for task 2.3 at the copied-plugin, parser/store, and instruction-contract boundaries.
- **Reason**: One live inbox owns lifecycle state; Markdown is only degraded transport, and unknown persistence cannot license a second write.
- **Do Not Repeat Until**: The complain routing, import schema, store identity, copied plugin composition, or exact maintained feedback format changes.
- **Evidence-Based Retry Condition**: Re-run after such a change or in final installed cold-model proof; do not treat this as complete triage, proposal, archive, or finite-population evidence.

## 2026-08-29 - Status And Triage R1 Accepted

- **Objective**: Make one status/decision slice bounded, stable, privacy-safe, and fail-closed before adding command/proposal orchestration.
- **Approach**: Select signals oldest-created/ref first, expose exact totals plus per-list truncation, derive current-root archive repair gaps from official movement without persisting a new state, and reject non-investigation decisions when owner class is unknown.
- **Evidence**: `evidence/task-2-4-triage-r1.md` records current source identities and provider-free copied-plugin proof. Twenty focused Kaizen tests, 18 session-env tests, 72 contracts, and strict OpenSpec validation passed. The repair fixture observed no gap before movement, one derived gap after movement, and no gap after closing the original checkpoint. A post-change reduction review removed one unused export and one duplicate helper; the focused proof remained green.
- **Outcome**: Accepted for task 2.4 at the store, copied-plugin status/decision, and current-root filesystem boundaries.
- **Reason**: The deterministic layer selects and validates bounded facts but does not score, group, infer ownership, or authorize a proposal.
- **Do Not Repeat Until**: Status ordering, decision schema, repair-gap derivation, projection bounds, or copied plugin composition changes.
- **Evidence-Based Retry Condition**: Re-run after such a change or in final installed command proof; do not use this slice as command quality, proposal containment, or complete-population evidence.

## 2026-08-29 - Triage Boundary R1 Rejected

- **Objective**: Prove one provider-free consumer-signal-to-owner-root proposal boundary for task 2.5.
- **Approach**: Exercise production status/decision tools in two disposable roots, create one reviewed proposal in the configured owner root, and invoke strict validation through portable Windows command resolution.
- **Evidence**: `evidence/triage-boundary-r1/bundle.json` retained all containment checks as true and terminal cleanup, but strict validation returned status 1. The runner retained only stderr byte count, so the failing invocation cause was not distinguishable.
- **Outcome**: Rejected as incomplete proof-runner diagnostics; no product defect was established.
- **Reason**: The candidate boundary was reached, but the runner did not preserve the exact validator diagnostics required to classify the failure.
- **Do Not Repeat Until**: Redacted validator stdout and stderr are retained.
- **Evidence-Based Retry Condition**: One instrumented local retry may use the same validation mechanism solely to obtain the missing exact diagnostic.

## 2026-08-29 - Triage Boundary R2 Rejected

- **Objective**: Classify the retained strict-validation failure without changing product behavior.
- **Approach**: Repeat the disposable boundary after adding redacted validator stdout/stderr retention.
- **Evidence**: `evidence/triage-boundary-r2/bundle.json` again retained all product/containment checks as true and cleanup complete. Stderr proved the WinGet `openspec.cmd` path was nested-quoted incorrectly by the proof runner, so OpenSpec never started.
- **Outcome**: Rejected as a proof-runner invocation defect; no OpenSpec candidate validation result exists in this bundle.
- **Reason**: Two materially similar shell-shim attempts did not advance the downstream validator boundary.
- **Do Not Repeat Until**: The validation mechanism bypasses the malformed command-shim quoting path.
- **Evidence-Based Retry Condition**: Resolve the installed package from the maintained command inventory, then invoke its Node entrypoint directly with the same fixture and evaluator.

## 2026-08-29 - Triage Boundary R3 Accepted

- **Objective**: Close task 2.5 at the configured proposal-owner-root and ordinary OpenSpec proposal boundary.
- **Approach**: Use a consumer-origin synthetic signal, reject non-owner cross-project detail access, read bounded details from the configured owner root, append one reviewed kit decision, create exactly one ordinary proposal there, and validate through the installed OpenSpec Node entrypoint.
- **Evidence**: `evidence/triage-boundary-r3/bundle.json` passed all checks. It records consumer origin, zero consumer-root writes, owner-only detailed access, one decision, one proposal change with four artifacts, strict validation status 0 and exact output, zero provider/network calls, unchanged active config, and removed fixture. Twenty-two focused Kaizen tests, 18 session-env tests, and strict validation of the active change also passed.
- **Outcome**: Accepted for task 2.5 at the provider-free command contract, copied production tool, canonical owner-root, decision, and disposable ordinary proposal boundaries.
- **Reason**: Proposal promotion is explicit, bounded to the configured canonical owner root, and remains separate from apply/archive/implementation or source-project mutation.
- **Do Not Repeat Until**: Status detail gating, proposal-owner environment semantics, command instructions, decision behavior, proposal workflow, or containment oracle changes.
- **Evidence-Based Retry Condition**: Re-run after such a material change or during final installed cold-command proof; do not treat this provider-free slice as installed model-command following or complete `KZN-001` evidence.

## 2026-08-29 - Provider-Free Population R1 Accepted

- **Objective**: Materialize and execute the reviewed `KZN-001` finite population without duplicating production behavior in a semantic test helper.
- **Approach**: Store the exact 25 ordered member-to-driver mapping in `tools/proofs/fixtures/cross-project-kaizen/population-v1.json`; emit stable focused-test names; strictly read back the seed; compare it directly with the claim population; and execute 24 focused production tests plus fresh nested archive and triage boundaries.
- **Evidence**: `evidence/population-r1/bundle.json` passed all checks and records 25 supported provider-free member observations. Its nested archive bundle passed captured, no-signal, repair-gap, unavailable, and archive-failed cases; its nested triage bundle passed consumer origin, non-owner rejection, one decision, one strict-valid owner-root proposal, and zero source writes. Seed readback/order, current source identity, loaded-mode inventory, active config, zero provider/network calls, and all cleanup checks passed.
- **Outcome**: Accepted for task 3.1 and the current provider-free finite-population boundary; it does not complete the broad installed `KZN-001` claim.
- **Reason**: Reviewed seed data owns member selection, exact drivers own observations, and deterministic code performs only schema/order/result correlation rather than scoring or semantic inference.
- **Do Not Repeat Until**: Production source, seed membership/mapping, focused test output, archive/triage drivers, or the complete installed-candidate identity changes.
- **Evidence-Based Retry Condition**: Re-run after one of those changes or during final current-candidate proof; do not substitute this bundle for the missing managed compaction prompt, cold installed command following, real oracle, SDET, or independent challenge.

## 2026-08-29 - Safety Population R2 Accepted

- **Objective**: Close task 3.2 with explicit fixed-envelope, failure, privacy, output, concurrency, and resource observations on the current provider-free candidate.
- **Approach**: Strengthen focused production tests for untouched malformed/partial record containment, near-limit record bytes, synthetic credential/home/project path removal, bounded status output, and original explicit-store filesystem cause; add measured elapsed and resource facts to the population runner; then replay the exact 25-member seed with fresh archive/triage children.
- **Evidence**: `evidence/population-r2/bundle.json` passed 25/25 observations with 26 focused tests, measured focused/archive/triage elapsed values, exact 2,000-signal/8,000-lifecycle and 16/4 KiB limits, source/config stability, zero provider/network calls, and terminal cleanup. `node tools/test-session-env-plugin.ts` also passed all 18 unrelated composition/redaction tests.
- **Outcome**: Accepted for task 3.2 and the current provider-free safety/resource boundary; the installed real oracle remains unknown.
- **Reason**: Each safety fact is exercised at its owning production or copied-plugin boundary, while the runner preserves only measured facts and exact reviewed mappings.
- **Do Not Repeat Until**: Store limits/schema, append/read behavior, redaction, status output, warning/cause behavior, session-env composition, seed mapping, or the current installed candidate changes.
- **Evidence-Based Retry Condition**: Re-run after one of those changes or for final current-candidate qualification; do not infer installed compaction, command-following, or broad safety closure from this provider-free bundle.

## 2026-08-29 - Profile Portability R1 Accepted

- **Objective**: Close task 3.3 by making the Kaizen commands and composed plugin available through both maintained runtime profiles without a second plugin owner or machine activation.
- **Approach**: Add `kaizen-status` and `kaizen-triage` to the canonical command catalog; include the existing cohesive `global/plugin` owner once in core while all retains directory ownership; render core with exactly `session-env` and the specialist catalog; extend materialization/readback assertions; and inventory the maintained proof CLI.
- **Evidence**: `evidence/task-3-3-portability-r1.md` records current source identities. Both effect-free installer previews exposed the commands and one plugin owner; the full library suite passed 188 tests with byte-matched core/all trees, exact two-plugin core config, representative transitive files, rollback, and machine-config preservation. Kaizen and session-env suites passed 26 and 18 tests. Runtime-source diagnostics reported the active managed compaction prompt as `different` with the expected restart boundary. Strict repository and OpenSpec validation passed, and the ignored machine config hash stayed byte-identical.
- **Outcome**: Accepted for task 3.3 and composed as `cross-project-kaizen-loop-portability-r1`; no install, activation, restart, or pinned OpenCode call occurred.
- **Reason**: The existing `global/plugin` directory is the smallest cohesive transitive owner and currently contains only `session-env` plus its Graphify, session-delivery, project-memory, and Kaizen imports. Core and all therefore expose one source owner without duplicating individual plugin files or broadening project bootstrap commands.
- **Do Not Repeat Until**: Profile catalogs/rendering, plugin transitive ownership, command files, installer preview, runtime-source diagnostics, or machine-config preservation behavior changes.
- **Evidence-Based Retry Condition**: Re-run after such a material change or during final installed proof; do not treat preview/materialization as installation, cold command following, task 2.1 capture, operator documentation, or complete `KZN-001` evidence.

## 2026-08-29 - Operator Documentation R1 Accepted

- **Objective**: Close task 3.4 with one current operator map for activation, lifecycle, privacy, containment, cleanup, and maintained proof without representing documentation as runtime proof.
- **Approach**: Add canonical `docs/kaizen.md`; correct only stale top-level README navigation/ownership claims; track every line in a documentation hardening ledger; and check each field, path class, state, effect, limit, and non-goal against loaded source, command/skill contracts, named status scenarios, and effect-free help output.
- **Evidence**: `evidence/task-3-4-docs-r1.md` and `evidence/task-3-4-documentation-ledger.md` cover all 608 README lines and 171 guide lines. Twenty-six named Kaizen scenarios passed in JSON output; proof and installer help exposed every documented mode/restart contract; strict repository/OpenSpec validation and instruction inventory passed. Three material documentation findings were fixed: stale core plugin scope, stale Markdown lifecycle ownership, and the absent guide.
- **Outcome**: Accepted for task 3.4 and composed as `cross-project-kaizen-loop-docs-r1`; documentation makes task 2.1, install/activation, cold command following, SDET, and independent challenge gaps explicit.
- **Reason**: One operational guide avoids duplicating detailed runtime contracts in README while still giving operators exact rollback, destructive cleanup, proposal containment, privacy ceiling, and proof boundaries.
- **Do Not Repeat Until**: Kaizen schemas/states/limits, data-root resolution, profile activation, command/tool contracts, archive/complain routing, cleanup semantics, or proof CLI changes.
- **Evidence-Based Retry Condition**: Re-run documentation hardening after such a material change or after task 2.1/final installed proof changes an explicit unknown; do not infer runtime support from prose.

## 2026-08-29 - KZN-GRIND-SERIAL-01

- **Strategy ID:** `KZN-GRIND-SERIAL-01`
- **Hypothesis:** Pausing Kaizen and transferring its shared instruction/proof-inventory roots to grind until grind archive preserves both candidates without concurrent-writer ambiguity.
- **Mechanism:** Owner-selected serial insertion; set Kaizen `mutationEnabled=false`, replace the planning-only relation with `archive-before-acquire`, and retain every existing Kaizen source/evidence artifact unchanged.
- **Candidate:** `cross-project-kaizen-loop-docs-r1` remains preserved and paused.
- **Environment:** `windows-node-24.18.1-docs-r1`; no Kaizen runtime invocation.
- **Evidence:** `ownership.json`; `../make-grind-blockers-task-scoped/ownership.json`; owner selection to archive grind before resuming Kaizen task 2.1.
- **Outcome:** Succeeded.
- **What Was Learned:** Grind can begin on completion-guard-local roots without modifying Kaizen implementation; shared `global/AGENTS.md`, `global/opencode.json.template`, `package.json`, and `tools/proofs/README.md` now have an explicit serial owner and archive transfer.
- **Supersedes:** The prior planning-only relation for grind. It does not supersede any Kaizen runtime or claim evidence.
- **Do Not Repeat Condition:** Do not resume Kaizen mutation or infer transferred ownership before grind archive.
- **Evidence-Based Retry Condition:** Re-evaluate ownership only if grind expands to another Kaizen root or archive transfer cannot be completed.
- **Claim Ceiling:** Ownership serialization only; Kaizen remains applying and `KZN-001` remains `unknown`.
