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

## 2026-08-30 - KZN-COMPACTION-CONTEXT-01

- **Strategy ID:** `KZN-COMPACTION-CONTEXT-01`
- **Hypothesis:** Injecting the mandatory envelope contract through the Kaizen plugin's append-only compaction context can stop the expected missing-envelope warning without replacing the managed summary prompt or waiting for a shared-template transfer.
- **Mechanism:** Re-enable only non-overlapping Kaizen plugin, test, and change-artifact roots; keep `global/AGENTS.md`, `global/opencode.json.template`, `package.json`, and `tools/proofs/README.md` reserved to grind; compose project-memory and Kaizen compaction hooks explicitly; retain strict post-compaction validation and visible real capture gaps.
- **Candidate:** `kaizen-compaction-runtime-context-r1`.
- **Environment:** `windows-node-24.18.1-opencode-1.18.25-context-hook-r1`.
- **Evidence:** The current Kaizen event hook reports `compaction-envelope-invalid` when the summary lacks exactly one envelope, while direct source inspection shows no envelope instruction in the active or template managed prompt. The pinned plugin SDK defines `output.context` as appended to the default prompt and `output.prompt` as its replacement. Project memory already owns the same hook inside `session-env`, so last-writer spread would lose an existing feature unless the hooks are composed. Instruction-governance review `ses_fadd4bfd0ffenQVXE4qBE4sS3h` confirmed the strict schema, composition, opt-out, and live followability risks.
- **Outcome:** Selected for one bounded non-overlapping implementation and proof slice.
- **What Was Learned:** The warning is not a parser false positive; capture was enabled before its model-facing envelope contract. The smallest safe repair is to append the missing contract at the loaded plugin boundary while preserving the default prompt and every existing context producer.
- **Supersedes:** `KZN-GRIND-SERIAL-01` only for the newly narrowed non-overlapping Kaizen plugin/test roots. Shared grind roots remain excluded until their existing archive transfer condition is met.
- **Do Not Repeat Condition:** Do not suppress the diagnostic, infer a missing envelope as `no-signal`, replace the compaction prompt, overwrite project-memory context, or mutate a shared grind root.
- **Evidence-Based Retry Condition:** Reconsider the prompt layer only if a copied-plugin provider request proves the append-only context is absent or a generated compaction summary fails the exact envelope contract despite receiving it.
- **Claim Ceiling:** Root-cause and selected-mechanism evidence only; runtime behavior and `KZN-001` remain `unknown` until current component and loaded boundaries pass.

## 2026-08-30 - Compaction Context R1 Inline Pure Config Rejected

- **Objective:** Prove that pinned OpenCode loads the copied production plugin, preserves the ordinary compaction prompt, appends the Kaizen context contract, and persists one valid synthetic compaction signal without a diagnostic.
- **Approach:** Supply the copied plugin, ordinary prompt sentinel, and loopback provider through `OPENCODE_CONFIG_CONTENT` in the existing pure configured proof-server environment.
- **Evidence:** `evidence/compaction-context-r1/bundle.json` preserved terminal cleanup and an unchanged active config. The ordinary prompt reached the only provider request and one root summary/event completed, but `pluginFactoryCompleted=false`, `kaizenContextReachedProvider=false`, and no signal or diagnostic was persisted. Source/copy plugin identities matched.
- **Outcome:** Rejected as a proof-runner configuration failure; Product Candidate behavior was not reached.
- **Reason:** The inline pure configuration path accepted model/agent fields but did not execute the explicit plugin factory, so it cannot evaluate the context hook or post-compaction capture.
- **Do Not Repeat Until:** Replay the retained r1 evaluator offline and replace inline pure configuration with the already accepted dual-root traced config-file loader.
- **Evidence-Based Retry Condition:** Offline replay classifies `proof-runner-config-loading`, both traced config preflights pass with zero provider requests, and one new bounded capture uses standard explicit plugin loading.
- **Claim Ceiling:** The ordinary prompt sentinel and root compaction path work in this fixture; loaded Kaizen context and capture remain unknown.

## 2026-08-30 - Compaction Context R2 Traced Config-File Loader

- **Objective:** Reach the loaded Kaizen compaction hook without repeating r1's non-plugin configuration path.
- **Approach:** Reuse the accepted loaded-tools dual runtime roots, dependency seeding, explicit `opencode.json`, standard plugin loader, traced plugin wrapper, and plugin-only/provider-added preflights before the isolated compaction capture.
- **Evidence:** R1 retained one ordinary-prompt provider request, no plugin factory trace, no Kaizen context, no inbox write, no diagnostic, and complete session/server/provider/root cleanup. The maintained loaded-tools R5 topology already proves this alternate loader executes the same copied `session-env` factory.
- **Outcome:** Selected for one bounded capture after offline replay.
- **Reason:** The mechanism changes the failed configuration/loader boundary while preserving the candidate, input, provider response, evaluator, containment, and cleanup envelope.
- **Do Not Repeat Until:** N/A - selected strategy.
- **Evidence-Based Retry Condition:** Re-evaluate only from retained r2 preflight, provider, store, event, diagnostics, and terminal cleanup evidence.
- **Claim Ceiling:** No runtime claim until both preflights and every loaded compaction check pass.

## 2026-08-30 - Compaction Context R2 Accepted

- **Objective:** Close task 2.1 at the copied production plugin and pinned OpenCode compaction boundary.
- **Approach:** Use the selected dual-root traced config-file loader, preserve the ordinary compaction prompt sentinel, append the Kaizen contract through normal hook composition, return one strict synthetic envelope, and read back only the resulting immutable signal.
- **Evidence:** `evidence/compaction-context-r2/bundle.json` passed every check. Plugin-only and provider-added preflights completed through source factory exit with zero provider requests. Pinned OpenCode 1.18.25 loaded the byte-matched copied plugin; the sole compaction provider request contained both the ordinary prompt sentinel and Kaizen context; exactly one root summary/event completed; one 1,137-byte privacy-safe compaction signal persisted; diagnostics and trapped egress remained zero; and session, server, provider, event stream, fixture, and active-config cleanup checks passed. Twenty-seven focused Kaizen scenarios and the composed project-memory hook test also passed.
- **Outcome:** Accepted for task 2.1 and candidate `kaizen-compaction-runtime-context-r1` at the copied-plugin loaded boundary.
- **Reason:** The evidence observes prompt preservation, appended context, strict envelope capture, root correlation, durable bounded readback, no capture-gap diagnostic, and complete local cleanup through the installed entry point.
- **Do Not Repeat Until:** Production compaction context/capture code, session-env composition, strict envelope schema, proof topology, or installed OpenCode identity changes.
- **Evidence-Based Retry Condition:** Re-run only after such a material change or as part of the complete installed `KZN-001` proof; do not use this exact slice as the two-project/archive/triage population proof.
- **Claim Ceiling:** Task 2.1 loaded compaction path only. The user's already-running OpenCode process still has the old hooks until restart, and complete `KZN-001` tasks 4.1-4.5 remain open.

## 2026-08-30 - Complete Population Composition R1 Accepted

- **Objective:** Close task 4.1 after all production mutations without adding a second runner or overstating provider-free rows as installed behavior.
- **Approach:** Reuse the maintained runner for one loaded report/status path, two independent loaded root compactions, provider-free two-project shared-store execution, all archive outcomes, owner-root proposal containment, and the canonical 25-member population; replay every loaded bundle offline before claim binding.
- **Evidence:** `evidence/loaded-tools-r6/bundle.json`, `evidence/compaction-context-r3a/bundle.json`, and `evidence/compaction-context-r3b/bundle.json` passed through pinned OpenCode `1.18.25`, byte-matched copied plugin source, bounded loopback provider calls, no trapped egress, and complete proof-owned cleanup. `evidence/store-boundary-r7/bundle.json`, `evidence/archive-boundary-r5/bundle.json`, `evidence/triage-boundary-r4/bundle.json`, and `evidence/population-r3/bundle.json` passed current provider-free production-module boundaries. `evidence/candidate-composition-r15.json` binds the exact candidate/environment and fidelity ceilings.
- **Outcome:** Accepted for task 4.1 as `cross-project-kaizen-loop-kzn-001-r1` at a mixed-fidelity pinned-environment ceiling.
- **Reason:** The installed entry point directly proves plugin/tool/compaction loading while the same source-identified production modules prove shared two-project storage, archive lifecycle, triage containment, and every reviewed finite-population member. This is sufficient for the bounded outcome but not for a universal or monolithic-installed claim.
- **Do Not Repeat Until:** Candidate source, proof topology, pinned OpenCode identity, a reviewer-confirmed material evidence gap, or a reproduced defect changes.
- **Evidence-Based Retry Condition:** Re-run only the affected lane after one of those changes; do not rerun unchanged configured-provider captures for confidence.
- **Claim Ceiling:** No activation/restart of the user's existing process, no unpinned-version support, no unknown-secret-format guarantee, and no claim that one installed process traversed all 25 members in one shared data root.

## 2026-08-30 - Focused Regression Disposition

- **Objective:** Add only a distinct requirement-linked regression after current runtime proof.
- **Approach:** Compare every task 4.1 observation with the maintained 27 Kaizen tests, 18 session-plugin tests, loaded bundle checks, and 25-member driver map.
- **Evidence:** `evidence/task-4-2-regression-disposition-r1.md` maps the accepted behaviors to existing direct oracles. Both focused suites passed before the fresh runtime proof, and no accepted-outcome defect was reproduced.
- **Outcome:** Initially `none`; superseded after fresh SDET exposed a distinct privacy-oracle gap.
- **Reason:** The pre-SDET evidence did not exercise delimiter-prefixed absolute paths.
- **Do Not Repeat Until:** A reviewer row, SDET row, validation failure, or runtime observation identifies a distinct reachable oracle gap.
- **Evidence-Based Retry Condition:** Add the smallest focused regression only after main independently reproduces such a gap.
- **Claim Ceiling:** Test sufficiency for the current accepted population only; independent challenge and critical-risk SDET remain pending.

## 2026-08-30 - Critical SDET R1 Privacy Defect Confirmed And Corrected

- **Objective:** Challenge credential/path retention, cross-project disclosure, consumer-to-kit mutation, and archive-state corruption against the current proved candidate.
- **Approach:** Dispatch one fresh test-only SDET with no write authority, then independently reproduce every reported critical row against the production module before correction.
- **Evidence:** SDET task `ses_fabf2d735ffeIcR1D4Un6u5Hus` returned `critical-risks-reported`. Main reproduced `KZN-H1-PRIV-PATH-BYPASS`: a delimiter-prefixed synthetic Windows absolute path persisted, while the whitespace-prefixed contrast failed with `privacy`. H2-H4 produced no current contradictory incident. `evidence/task-4-3-sdet-r1.md` records the bounded matrix and disposition.
- **Outcome:** Confirmed one reachable critical privacy defect. The existing `sanitize` owner now rejects delimiter-prefixed Windows drive, UNC, and POSIX absolute-path tokens; the existing privacy test covers those cases and a public HTTPS control. Focused Kaizen tests and an exact production-module probe pass after correction.
- **Reason:** The prior regex recognized drive and selected POSIX paths only at string start or after whitespace, so assignment/JSON delimiters bypassed the fail-closed privacy boundary.
- **Do Not Repeat Until:** Do not run unchanged configured-provider proof. The store mutation must first be composed into a corrected candidate and all affected raw bundles must be recaptured under new immutable evidence roots.
- **Evidence-Based Retry Condition:** Provider-free exact reproduction is green, focused tests are green, prior loaded bundles replay terminally with complete cleanup, and the next attempt is explicitly a corrected-candidate capture.
- **Claim Ceiling:** Candidate `cross-project-kaizen-loop-kzn-001-r1` is invalidated. Corrected candidate remains `development`; unknown secret formats and unpinned environments remain out of claim.

## 2026-08-30 - Corrected Candidate Capture Strategy Selected

- **Objective:** Restore current Runtime Proof after the confirmed sanitizer correction without changing runner topology or increasing effects.
- **Approach:** Reuse the existing preflight and exactly the seven affected lanes: loaded report/status, two loaded compactions, shared two-project store, archive outcomes, triage containment, and the 25-member population. Use create-new evidence roots and the same bounded synthetic provider behavior.
- **Evidence:** Preserved R1 bundles `loaded-tools-r6`, `compaction-context-r3a`, and `compaction-context-r3b` replayed to `terminalReplay=passed` with `productCandidateReached=true`, `providerReached=true`, and complete proof-owned cleanup. The exact corrected production-module probe reports path rejection and no retention; all 27 focused tests pass.
- **Outcome:** Selected; Live-Attempt Gate is clear for corrected-candidate recapture only.
- **Reason:** Product Candidate mutation, not runner/evaluator wording or a confidence retry, changes the affected behavior and source identity.
- **Do Not Repeat Until:** A current lane fails and its complete raw bundle is replayed through terminal evaluation, or another product/runner/environment mutation invalidates a lane.
- **Evidence-Based Retry Condition:** Re-run only a causally affected lane after inspecting its retained terminal diagnostics and satisfying the corresponding replay unlock condition.
- **Claim Ceiling:** No corrected-candidate claim until every affected lane passes and source identities bind to one candidate composition.

## 2026-08-30 - Corrected Candidate Population R2 Accepted

- **Objective:** Restore all store-dependent proof after the critical sanitizer correction.
- **Approach:** Execute the selected existing runner topology against create-new evidence roots, then replay each configured bundle offline through its terminal verdict.
- **Evidence:** `loaded-tools-r7`, `compaction-context-r4a`, `compaction-context-r4b`, `store-boundary-r8`, `archive-boundary-r6`, `triage-boundary-r5`, and `population-r4` all pass. The corrected store digest is `4044c811ef4cadf9c1ffbb78202b9d6f12145ed18b19fef7e6a2f06115f1bc73`; the corrected test digest is `a148411d0c1a63c3daf4df3fa870f63a8fed7dfeba2e1817e0d371f8f47ef748`. Loaded source/copy identity is `1a9c713ee082313377e081756ac4ca0b72a063900870a9cb31eabe6529ecbeca`. Every loaded replay reports `terminalReplay=passed` and complete proof-owned cleanup.
- **Outcome:** Accepted as candidate `cross-project-kaizen-loop-kzn-001-r2`, composed in `evidence/candidate-composition-r16.json`.
- **Reason:** Every Product Candidate-dependent lane was recaptured after mutation; no pre-fix runtime bundle is used as current evidence.
- **Do Not Repeat Until:** A current-candidate mutation, environment change, runner/evaluator change affecting observations, corrected SDET finding, or evidence-sufficiency finding invalidates a named lane.
- **Evidence-Based Retry Condition:** Re-run only the invalidated lane after current diagnostics and replay identify the exact affected boundary.
- **Claim Ceiling:** Mixed-fidelity pinned Windows/OpenCode population only; no active-process activation, unpinned compatibility, unknown-secret-format, or monolithic-installed-population claim.

## 2026-08-30 - Critical SDET R2 Forward-UNC Defect Confirmed And Corrected

- **Objective:** Re-challenge the corrected candidate against the same four critical hypotheses.
- **Approach:** Dispatch one new fresh test-only SDET after R2 proof, then independently reproduce every reported critical row before mutation.
- **Evidence:** SDET task `ses_fabdeffe7ffeMN18VtyYze27us` returned `critical-risks-reported`. It verified the R1 Windows/POSIX/backslash-UNC cases but found forward-slash UNC retention and a backtick delimiter bypass. Main reproduced both against R2. H2-H4 again produced no current incident.
- **Outcome:** Confirmed a second reachable privacy defect in the same sanitizer owner. Non-token boundary checks now cover arbitrary delimiters, forward/backslash UNC, Windows drive, POSIX, and `file://` path URI representations while preserving HTTP(S) controls. The maintained 27-test suite and an exact 11-path/two-URL production-module matrix pass.
- **Reason:** The first correction still enumerated delimiters and deliberately excluded double-forward-slash tokens to avoid false-positive URL rejection; it did not distinguish a scheme colon from assignment/JSON/start boundaries.
- **Do Not Repeat Until:** Do not run unchanged R2 configured proof. Recompose the current source as R3 and recapture every store-dependent lane once.
- **Evidence-Based Retry Condition:** All focused tests and the broad exact provider-free path/URL matrix are green, R2 loaded bundles remain preserved and terminal, and new proof roots are create-new.
- **Claim Ceiling:** Candidate R2 is invalidated. Unknown encodings and secret formats remain outside the maintained population rather than implied safe.

## 2026-08-30 - Corrected Candidate R3 Capture Strategy Selected

- **Objective:** Restore current proof after the second sanitizer correction without changing the accepted proof topology.
- **Approach:** Reuse the same seven lanes and bounded provider behavior under new immutable evidence roots; no runner, evaluator, environment, timeout, or effect increase.
- **Evidence:** The second correction is provider-free green at both the maintained 27-test suite and exact production-module matrix. R2 configured bundles retain terminal pass and complete cleanup; no proof-owned process remains.
- **Outcome:** Selected; Live-Attempt Gate is clear for R3 corrected-candidate recapture only.
- **Reason:** This is a materially changed Product Candidate responding to a newly reproduced privacy path, not an unchanged confidence retry.
- **Do Not Repeat Until:** Inspect and replay any failed R3 lane before another live attempt, or wait for another material invalidation.
- **Evidence-Based Retry Condition:** Only the exact affected lane may rerun after its terminal diagnostics and replay satisfy the stored unlock condition.
- **Claim Ceiling:** No R3 claim until all affected lanes pass, fresh SDET is terminal, and independent evidence challenge completes.

## 2026-08-30 - Corrected Candidate Population R3 Accepted

- **Objective:** Restore complete current proof after the final privacy-boundary correction.
- **Approach:** Run the selected seven-lane topology once under new roots and replay the three configured bundles offline.
- **Evidence:** `loaded-tools-r8`, `compaction-context-r5a`, `compaction-context-r5b`, `store-boundary-r9`, `archive-boundary-r7`, `triage-boundary-r6`, and `population-r5` pass. Store/test digests are `3a74cf7b4d4e4a671e3ff76f40fbe4879603c579d45c2d5e452dfb468a5833e6` and `8a17819ba5ac413375ef4b7947f8c6a98a4668b52e891ca15ca3bf2a721c83fc`; copied source identity is `a2a5c39e0fa8b35fa1e351c7bf34d33a5318d532949794a90b0edf859b9f026e`. Every configured replay is terminal pass with complete cleanup.
- **Outcome:** Accepted as candidate `cross-project-kaizen-loop-kzn-001-r3`, composed in `evidence/candidate-composition-r17.json`.
- **Reason:** No current proof row depends on pre-correction product identity; the maintained privacy population now includes both confirmed failure patterns.
- **Do Not Repeat Until:** Current candidate/environment/runner mutation or a fresh terminal reviewer finding invalidates a named lane.
- **Evidence-Based Retry Condition:** Re-run only the invalidated lane after current diagnostics and provider-free replay.
- **Claim Ceiling:** Mixed-fidelity pinned environment and maintained privacy formats; active process, unpinned compatibility, unknown encoding, and one-process population equivalence remain excluded.

## 2026-08-30 - Critical SDET R3 Terminal

- **Objective:** Obtain fresh terminal critical-risk evidence on the fully re-proved R3 candidate.
- **Approach:** Dispatch one new test-only SDET with no write authority against R3 source, all seven current bundles, maintained focused tests, and bounded provider-free H1-H4 probes.
- **Evidence:** SDET task `ses_fabcc6944ffeEPxIwe3B8tXtIv` returned `no-critical-risk` with Effective Model `xai/grok-4.6`. It rejected 17/17 maintained privacy-path forms, accepted HTTP(S) controls, retained no tested credential/root/path values, preserved owner-gated cross-project details, observed no consumer-to-kit mutation, and rejected illegal archive/harvest relabeling. `evidence/task-4-3-sdet-r1.md` records all three SDET episodes and main dispositions.
- **Outcome:** Task 4.3 complete for candidate `cross-project-kaizen-loop-kzn-001-r3`; no confirmed reachable critical or non-deferrable defect remains in the maintained envelope.
- **Reason:** Both prior critical findings were independently reproduced, corrected, re-proved, and re-challenged on a materially changed candidate; R3 produced no new critical row.
- **Do Not Repeat Until:** A later Product Candidate mutation or new decision-changing evidence identifies a distinct reachable critical hypothesis.
- **Evidence-Based Retry Condition:** Re-prove the changed candidate first, then dispatch a new fresh SDET only for the changed or newly evidenced hypothesis.
- **Claim Ceiling:** Unknown encodings/secret formats, active-process activation, unpinned/non-Windows behavior, and monolithic installed-population equivalence remain excluded.

## 2026-08-30 - KZN-001 Evidence Challenge Complete

- **Objective:** Challenge every declared finite-population row and the R3 maximum claim without mutating the frozen candidate.
- **Approach:** Materialize the reviewed 25-member seed into the schema-v2 index, resolve every current and historical lane, then dispatch one fresh read-only evidence-sufficiency reviewer.
- **Evidence:** Reviewer task `ses_fabc0dcedffeZRVi1RoPaybaBv` returned Practice Observation `no-material-finding` with Effective Model `xai/grok-4.6`. It verified exact 25-member order, current candidate/environment/path/boundary refs, all lane hashes, current source/copy identities, terminal bundle status/cleanup, historical R1/R2 separation, real-oracle consistency, and retention inventory. `evidence/task-4-4-evidence-challenge-r1.md` records the bounded result.
- **Outcome:** Task 4.4 complete. `KZN-001` remains `narrowed`, not universal or uniformly installed; independent challenge is complete.
- **Reason:** Every current row is supported at its declared fidelity and no pre-fix or historical bundle is represented as current evidence.
- **Do Not Repeat Until:** Candidate, environment, population, member evidence refs, maximum claim, or a material retained lane changes.
- **Evidence-Based Retry Condition:** Only a changed decision surface or a reproduced current evidence mismatch permits another broad challenge.
- **Claim Ceiling:** Preserve all R3 residual ceilings: no monolithic installed population, active-process activation, loaded complete-archive harvest, unpinned/non-Windows support, or unknown-secret-format guarantee.

## 2026-08-30 - Final Validation Complete

- **Objective:** Close task 4.5 on the frozen R3 candidate without repeating configured-provider proof or hiding validation limits.
- **Approach:** Reuse current R3 runtime bundles, run affected focused/config/profile/permission checks, attempt the exact project aggregate once, close timed-out writer liveness, cover the same test inventory in bounded batches, then run strict library/OpenSpec validation and scoped diff/graph inspection.
- **Evidence:** `evidence/task-4-5-validation-r1.md` records every command and outcome. Focused Kaizen/session/project-memory/contracts/install/workstation, profile, canonical instruction, permissions, strict library, strict OpenSpec, and all five exact-inventory test batches pass. The exact `npm test` aggregate is terminal-unknown after the fixed 420-second timeout; no test process remained.
- **Outcome:** Task 4.5 complete with one contained non-critical proof-runner limitation. All 18 tasks are complete.
- **Reason:** Every file in the project-native test command passed under the same Node test runner and concurrency contract; the aggregate timeout is preserved as unknown rather than used as a product failure or false pass.
- **Do Not Repeat Until:** Aggregate test runtime materially changes or the fixed-timeout runner gains terminal-result capture; do not repeat the unchanged 420-second aggregate for confidence.
- **Evidence-Based Retry Condition:** A causally different terminal-result mechanism or a changed candidate/test inventory may justify another aggregate run.
- **Claim Ceiling:** Validation is complete for the current file inventory; exact aggregate invocation status remains unknown and the R3 mixed-fidelity ceilings remain unchanged.
