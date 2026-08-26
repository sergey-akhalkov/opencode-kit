# Strategy History

## 2026-08-25 - One Shared Tips File

- **Objective**: Preserve reusable project lessons with the smallest human-readable artifact.
- **Approach**: Add one growing `tips-and-tricks.md` and tell agents to read it.
- **Evidence**: The repository already uses compact Markdown Serena memories, but they rely on progressive references; a single unfiltered file has no relevance threshold, freshness status, invalidation lifecycle, or context budget.
- **Outcome**: Rejected.
- **Reason**: It solves persistence but not task-aware retrieval, bounded context, stale guidance, or safe lifecycle management.
- **Do Not Repeat Until**: The accepted outcome no longer requires cue-based recall, freshness, or a bounded prompt capsule.
- **Evidence-Based Retry Condition**: A measured corpus remains small enough to inject completely and current requirements remove ranking and invalidation behavior.

## 2026-08-25 - Hosted Or Separate Memory Runtime

- **Objective**: Reuse an established semantic memory system and avoid implementing storage/retrieval locally.
- **Approach**: Evaluate Mem0's OpenCode plugin pattern plus Letta/Graphiti-style memory and a dedicated MCP/server boundary.
- **Evidence**: Those designs provide capture/search patterns, but the current project requires local project authority, no raw transcript capture, no hosted dependency, no additional MCP, and no embeddings before a measured lexical miss. Mem0's broader tool surface and service lifecycle exceed the bounded increment.
- **Outcome**: Rejected for the current increment; retained only as reference evidence.
- **Reason**: Added privacy, availability, migration, dependency, and context-surface cost is not justified by the bounded local claim.
- **Do Not Repeat Until**: Local lexical/structured recall has a reproduced accepted-query miss or requirements add cross-device/cross-project semantic sharing.
- **Evidence-Based Retry Condition**: A preserved corpus demonstrates vocabulary-only failure that exact trigger/path/symbol and lexical ranking cannot recover, with owner-approved external-data and service semantics.

## 2026-08-25 - Local Plugin With Append-Only Markdown

- **Objective**: Complete persistence, explicit admission, bounded recall, re-verification, and forgetting while preserving existing OpenCode and Serena owners.
- **Approach**: Extend `session-env`, add two tools and root-only hooks, keep local immutable Markdown events under a project-hashed OpenCode data path, read Serena memories directly as a bounded curated layer, and rank with deterministic lexical plus structured signals.
- **Evidence**: `session-env` already owns global custom tools and hooks; the existing redaction module is reusable; `.serena/memories/` is Git-tracked and referentially valid; fixed-slot immutable events avoid mutable-file locking, destructive deletion, and cross-process capacity races; no external dependency is needed inside the stated 2,000-card/10,000-event envelope.
- **Outcome**: Selected for proposal and implementation planning.
- **Reason**: It is the smallest design that closes the required memory cycle without adding hosted storage, another server, automatic transcript mining, or prompt bloat.
- **Do Not Repeat Until**: N/A - selected strategy.
- **Evidence-Based Retry Condition**: Re-evaluate only if implementation evidence disproves copied-plugin hook composition, append-only folding, privacy-safe local storage, or bounded direct-scan performance.

## 2026-08-25 - Serialized Ownership Reconciliation

- **Objective**: Acquire a non-overlapping implementation write set without losing unrelated worktree changes.
- **Approach**: Inspect active changes, scoped Git state, the repository candidate snapshot, and the call graph before production mutation; keep shared redaction and existing session-plugin/runtime/installer tests read-only and extend only the current `session-env` composition owner plus new project-memory files.
- **Evidence**: `global/plugin/session-env.ts`, shared redaction, and `tools/test-session-env-plugin.ts` are clean; graph tracing finds four test-side callers of `session-env.server` and no production callee edge. `package.json` and `tools/proofs/README.md` contain preserved changes from already archived work, whose writers are closed. `tools/runtime-surface-profile.ts` and `tools/install-opencode-global.ts` are dirty but remain outside this change's write roots. The only other active change has no acquired ownership and is serialized after this change.
- **Outcome**: Selected write set is non-overlapping. Added the existing proof inventory to this change's write roots and preserved every pre-existing edit.
- **Reason**: The change can add a co-located module and new focused proof/test owners without touching foreign dirty runtime or installer surfaces; later edits to shared `package.json` and proof inventory can be narrow appends over closed prior work.
- **Do Not Repeat Until**: A new active writer appears, a planned write root changes, or scoped Git/graph state changes before the first production edit.
- **Evidence-Based Retry Condition**: Re-run ownership reconciliation if another active change acquires an overlapping path or any selected production/test/proof owner changes unexpectedly.

## 2026-08-25 - Loaded Entry Proof R1 With Missing Database Parent

- **Objective**: Observe the copied `session-env` plugin through pinned OpenCode and a deterministic loopback provider without external or worktree effects.
- **Approach**: Materialize the plugin and isolated config/data/home roots, seed one promoted procedure, then launch OpenCode `1.18.23` for one root prompt while capturing the provider request and terminal process evidence.
- **Evidence**: `implementation-evidence/task-1-3-loaded-r1/raw.json` records exit `1`, no provider request, unchanged disposable Git status, zero trapped egress, and stderr `unable to open database file`; the runner set `OPENCODE_DB` below an uncreated `runtime` parent.
- **Outcome**: Proof Runner failure before plugin loading; no Product Candidate conclusion.
- **Reason**: SQLite can create the database file but not the missing parent directory, so the environment failed before the loaded-entry boundary.
- **Do Not Repeat Until**: The proof runner points `OPENCODE_DB` into an existing parent and passes syntax plus effect-free help checks.
- **Evidence-Based Retry Condition**: Re-run the same exact-case candidate only after the database path is contained directly under the already-created fixture root; preserve R1 as the failed predecessor bundle.

## 2026-08-25 - Loaded Entry Proof R2 Without Phase Trace

- **Objective**: Reach the same pinned loaded-entry oracle after correcting the R1 database-parent defect.
- **Approach**: Re-run the materialized plugin, isolated roots, seeded procedure, and loopback provider with `OPENCODE_DB` directly under the existing fixture root.
- **Evidence**: The outer command timed out after 180 seconds and left orphaned OpenCode PID `5900`; it had no children and was terminally closed with exact-PID `Stop-Process`. `implementation-evidence/task-1-3-loaded-r2/raw.json` preserves the process facts. The OpenCode log stopped after loading `opencode.jsonc`; subsequent offline probes imported the exact copy under Bun and resolved both disabled and enabled `debug config` with exit `0`.
- **Outcome**: Proof Runner or runtime hang after config resolution; no Product Candidate conclusion and no provider-request evidence.
- **Reason**: The missing phase trace prevents distinguishing hook factory, automatic top-level plugin discovery, session lookup, and provider startup. Copying the whole module directly under `config/plugin` also introduced an avoidable auto-discovery ambiguity.
- **Do Not Repeat Until**: The copy is outside the auto-discovered plugin directory, proof-only tracing brackets factory/message/system phases, and the runner itself can terminally stop the exact child PID on timeout.
- **Evidence-Based Retry Condition**: Use one causally distinct traced wrapper around the copied production plugin, a non-auto-discovered materialization path, and exact-PID closure; retain R2 as a failed predecessor rather than treating its timeout as a product defect.

## 2026-08-25 - Loaded Entry Proof R3 With Traced Product And Runner Defects

- **Objective**: Distinguish plugin lifecycle progress from provider startup by tracing the unchanged copied production plugin outside OpenCode's auto-discovered plugin directory.
- **Approach**: Wrap the explicitly configured copy with fixture-local factory/message/system traces, retain the isolated loopback provider, and bracket the same root prompt.
- **Evidence**: `implementation-evidence/task-1-3-loaded-r3/raw.json` records factory enter/exit, root message enter/exit, and system enter/exit in order. The OpenCode log records `Expected a string starting with "ses", got "%7Bid%7D"`, proving the plugin used the wrong generated-SDK argument shape; installed SDK declarations require `path.id` and optional `query.directory`. The same log records an attempted ripgrep download, and the 120-second runner timer interrupted the loopback provider before model completion.
- **Outcome**: One reproduced Product Candidate root-lookup defect plus proof-runner isolation/response defects; no capsule or provider-request claim.
- **Reason**: The product used the newer flat SDK call convention against the loaded plugin's generated path/query client. The runner also began its timeout before an unseeded ripgrep startup delay and returned non-streaming output to a streaming request.
- **Do Not Repeat Until**: Product lookup uses `path.id` plus `query.directory` with a focused argument-shape regression; the runner requires and seeds a local ripgrep executable, emits SSE when requested, and passes syntax/help/focused tests.
- **Evidence-Based Retry Condition**: After those offline corrections are green, one successor loaded attempt may exercise the same exact case with R1-R3 retained as predecessor evidence.

## 2026-08-25 - Loaded Entry Proof R4 Stalled Before Factory

- **Objective**: Exercise the corrected SDK lookup with an explicit seeded ripgrep binary and streaming-compatible loopback response.
- **Approach**: Apply all R3 unlock conditions, extend the bounded runner timeout to accommodate observed cold startup, and invoke the same exact root prompt against a fresh isolated fixture.
- **Evidence**: `implementation-evidence/task-1-3-loaded-r4/raw.json` records a 300-second outer timeout, no factory trace, no provider request, unchanged disposable Git status, and an OpenCode log ending during `opencode.jsonc` loading. Exact orphan PID `12544` was terminally closed and no fixture process remains.
- **Outcome**: Proof-environment configuration-resolution failure before the corrected Product Candidate loaded.
- **Reason**: Unknown after this attempt. The observed ceiling excludes project-memory factory/message/system behavior because none ran; repeating the loaded-model command cannot distinguish package resolution, isolated-cache state, proxy behavior, or runner process control.
- **Do Not Repeat Until**: A bounded offline probe on the preserved materialized config identifies a causal config-resolution difference and the runner can preserve a terminal report without relying on the outer tool timeout.
- **Evidence-Based Retry Condition**: Diagnose the materialized R4 config without a model request, correct the smallest proven proof-environment cause, and require a green bounded config preflight before any successor loaded run.

## 2026-08-25 - Staged Config Preflight R1

- **Objective**: Close R4's cold resolver ambiguity without issuing a model request.
- **Approach**: Seed an explicitly verified OpenCode `1.18.23` plugin-runtime closure into both isolated dependency roots, then run plugin-only and provider-added `debug config` phases with independent factory traces before cleanup.
- **Evidence**: `implementation-evidence/task-1-3-config-preflight-r1/evaluation.json` is `complete`; both phases exited `0`, reached factory enter/exit, made zero provider requests, trapped zero egress, and preserved disposable Git status. Runtime package and ripgrep identities are recorded by SHA-256.
- **Outcome**: Selected gate mechanism; loaded-model gate reopened for one successor attempt.
- **Reason**: It distinguishes and prewarms dependency/config resolution while preserving fresh roots, offline containment, and a no-model stop line.
- **Do Not Repeat Until**: The runner/config/plugin dependency identity changes or a loaded attempt fails before factory despite a green same-candidate preflight.
- **Evidence-Based Retry Condition**: Re-run after a proof-runner/config identity change; each loaded mode must still execute its own two green preflights.

## 2026-08-25 - Loaded Entry Proof R5 Reached Capsule Before Harness Stop

- **Objective**: Exercise the corrected SDK root lookup after the staged config gate.
- **Approach**: Repeat both green preflights in a fresh fixture, seed/promote one procedure, and run one root prompt against the SSE loopback provider.
- **Evidence**: `implementation-evidence/task-1-3-loaded-r5/raw.json` records one provider request, one advisory capsule containing the selected procedure, ordered factory/message/system phases, 9,719 request bytes, zero trapped egress, and unchanged Git status. The streamed assistant response and step-finish are present, but the 120-second model timer set `timedOut: true` and stopped the process. Tool names are empty because the proof config set global permission to `deny`.
- **Outcome**: Core loaded injection exact case observed; full task oracle failed on runner timeout and tool-advertisement configuration.
- **Reason**: Cold session creation reached the root message near the 120-second model-only bound; the successful stream completed immediately afterward. Global deny also intentionally filtered every tool before the provider request.
- **Do Not Repeat Until**: The model-only bound exceeds the observed successful completion window and the proof config allows exactly `project_memory_recall`, `project_memory_manage`, and `session_delivery_context` while denying all other tools.
- **Evidence-Based Retry Condition**: With the same staged preflight, use a 180-second model-only bound and the three-tool allowlist; retain R5 as narrower positive capsule evidence, not a complete task result.

## 2026-08-25 - Loaded Entry Proof R6 Confirmed Timer-Coupled CLI Progress

- **Objective**: Complete the R5 exact case with the three-tool allowlist and an evidence-based 180-second model-only bound.
- **Approach**: Repeat both no-model preflights, then use the same `opencode run` mechanism with only the three expected tools allowed.
- **Evidence**: `implementation-evidence/task-1-3-loaded-r6/raw.json` records all provider-side checks passing: one bounded request, one selected capsule, ordered root message/system phases, both project-memory tools plus `session_delivery_context`, zero trapped egress, and unchanged Git status. The root message began 178.4 seconds after factory load, coincident with the 180-second stop timer; the streamed response completed, but the CLI was again stopped rather than exiting naturally.
- **Outcome**: Loaded project-memory behavior and tool composition observed; CLI-run lifecycle oracle remains failed.
- **Reason**: Raising the timer shifted progress to the new timer boundary, so another timeout increase would repeat the wrong mechanism. `opencode run` is not a controllable terminal boundary in this isolated proof envelope.
- **Do Not Repeat Until**: N/A - do not repeat the `opencode run` mechanism for this task.
- **Evidence-Based Retry Condition**: Use the repository's established `opencode serve` boundary instead: wait for HTTP readiness, create and prompt one root through the SDK, then explicitly stop and verify the long-running server after provider capture.

## 2026-08-25 - Loaded Entry Proof R7 Used A Launcher Instead Of The Owning Binary

- **Objective**: Replace timer-coupled `opencode run` with a ready/prompt/controlled-stop server boundary.
- **Approach**: Start `opencode serve`, wait for HTTP readiness, create and prompt one root via the local SDK, then stop the direct child and verify listener closure.
- **Evidence**: `implementation-evidence/task-1-3-loaded-r7/raw.json` records green preflights and ordered factory/message/system phases through the prompt. Stop timed out because the explicit `.bun/bin/opencode.exe` input was a launcher process; after the runner ended, the surviving server command identified the real executable under `.bun/install/global/node_modules/opencode-ai/bin/opencode.exe` with a different PID. Exact manual closure of that server PID also closed the listener.
- **Outcome**: Serve workload reached project-memory hooks, but runner lifecycle and provider-request evidence were not finalized.
- **Reason**: The runner owned and stopped the launcher, not the server process it spawned. This is an executable-identity input defect, not a project-memory or serve-boundary defect.
- **Do Not Repeat Until**: `--opencode` names the actual pinned server executable whose spawned PID owns the listener, not the user-facing launcher shim.
- **Evidence-Based Retry Condition**: Verify the real executable directly reports `1.18.23`, run the no-model preflight with that exact path, then use the same serve mechanism; do not add broad process-tree termination while direct identity is available.

## 2026-08-25 - Staged Config Preflight R2 Permission And Timeout Identity

- **Objective**: Re-qualify no-model configuration after introducing the three-tool allowlist and a 180-second model bound.
- **Approach**: Reused the seeded OpenCode `1.18.23` runtime and ran plugin-only then provider-added `debug config` phases.
- **Evidence**: `implementation-evidence/task-1-3-config-preflight-r2/evaluation.json` is complete.
- **Outcome**: Selected preflight identity for R6.
- **Reason**: The permission change altered the loaded configuration identity.
- **Do Not Repeat Until**: The runner, configuration, or plugin identity changes again.
- **Evidence-Based Retry Condition**: Re-run after one of those identities changes; each loaded mode still runs its own preflights.

## 2026-08-25 - Staged Config Preflight R3 Serve-Mode Runner Identity

- **Objective**: Re-qualify no-model configuration after switching the loaded path to `opencode serve`.
- **Approach**: Ran the same two `debug config` phases with the serve-capable runner.
- **Evidence**: `implementation-evidence/task-1-3-config-preflight-r3/evaluation.json` is complete.
- **Outcome**: Unlocked R7.
- **Reason**: The runner identity changed.
- **Do Not Repeat Until**: The runner, configuration, or plugin identity changes.
- **Evidence-Based Retry Condition**: Re-run only after an identity change.

## 2026-08-25 - Staged Config Preflight R4 Owning Binary

- **Objective**: Re-qualify no-model configuration with the real `opencode-ai/bin/opencode.exe`.
- **Approach**: Passed the owning OpenCode `1.18.23` binary with SHA-256 `f831518278ded5090c41cc532b16ab80629e980f710a0b46d1e5b605808bb1d9` through the two preflight phases.
- **Evidence**: `implementation-evidence/task-1-3-config-preflight-r4/evaluation.json` is complete.
- **Outcome**: Unlocked R8.
- **Reason**: Executable identity was the R7 lifecycle defect.
- **Do Not Repeat Until**: The binary, runtime, or ripgrep identity changes.
- **Evidence-Based Retry Condition**: Verify binary version and hash, then run preflight before any later serve proof.

## 2026-08-25 - Loaded Entry Proof R8 Serve With Owning Binary

- **Objective**: Complete task `1.3` with one exact-case loaded-entry oracle and a controllable lifecycle.
- **Approach**: Created a fresh fixture, required green preflights, started `opencode serve`, used the SDK for one root session create and prompt, allowed only the two project-memory tools plus `session_delivery_context`, streamed the loopback provider response, and stopped the exact owning PID.
- **Evidence**: `implementation-evidence/task-1-3-loaded-r8/evaluation.json` is complete with every listed check true.
- **Outcome**: Selected exact-case loaded-entry mechanism.
- **Reason**: The direct owning binary closed the listener on stop, while serve avoided the timer-coupled `opencode run` lifecycle.
- **Do Not Repeat Until**: Product, plugin, runtime, or binary identity changes, or a later task requires a different run mode.
- **Evidence-Based Retry Condition**: Retry only after an identity change and a green preflight; do not rerun merely to strengthen `PMC-001`.

## 2026-08-25 - Post-R8 Escaped-Path Evidence Redaction

- **Objective**: Remove private fixture paths from accepted R8 raw stderr without rerunning OpenCode.
- **Approach**: Extended runner redaction for JSON-escaped Windows paths and replaced 17 escaped fixture-root occurrences in the R8 bundle with `<fixture-root>`.
- **Evidence**: The replacement count was 17; a subsequent scoped search found no remaining host user path in the R8 bundle.
- **Outcome**: Selected privacy correction; the R8 runtime oracle is unchanged.
- **Reason**: OpenCode logs double-escape Windows path separators.
- **Do Not Repeat Until**: A new bundle exposes an unredacted path class.
- **Evidence-Based Retry Condition**: Extend redaction offline for a newly observed escape form; do not rerun a live proof solely to sanitize evidence.

## 2026-08-25 - Complete Loaded Population Boundary With Pre-Cleanup Capture

- **Objective**: Re-prove the final production candidate across the reviewed loaded tool, root, selection, compaction, curated, failure, privacy, and cleanup scenarios without broadening `PMC-001` beyond observed evidence.
- **Approach**: Extend the existing provider-free runner with one pinned `opencode serve` path, a deterministic tool-calling loopback provider, explicit system/compaction gates, over-limit and privacy fixtures, and a redacted durable capture written before session/server/fixture cleanup. Keep the maintained corpus, direct full-envelope scan, and package command as the offline lanes rather than adding another runner.
- **Evidence**: `task-4-1-loaded-r1` completed all behavioral checks but exposed that durable raw output was written only after cleanup. Runner `98ca133f9b280b4c96661fc57f2a5d6e53a5334d629a2ada2ca4713535acfc6c` added `capture.json`; `task-4-1-config-preflight-r2` was green, and `task-4-1-loaded-r2` completed all 25 checks with 21 bounded requests, zero trapped egress, unchanged Git status, privacy-safe artifacts, closed proof port, and no new fixture root.
- **Outcome**: Selected R2 as the current loaded oracle for task `4.1`; broad population disposition remains `unknown` pending the required fresh SDET, candidate freeze, observation binding, and evidence-sufficiency challenge.
- **Reason**: The successor changes the evidence lifecycle rather than repeating the loaded behavior: current observations are durable before cleanup while terminal raw/evaluation retain cleanup and exact-process facts.
- **Do Not Repeat Until**: Product, runner, evaluator, OpenCode, plugin-runtime, or ripgrep identity changes, or an independent challenge identifies one distinct reachable unsupported scenario.
- **Evidence-Based Retry Condition**: Correct the smallest reproduced in-scope defect, rerun the affected offline lane and green no-model preflight, then perform only the minimum loaded scenario needed by that changed risk.

## 2026-08-25 - SDET Fingerprint Oracle Requires Message-Time Reselection

- **Objective**: Independently challenge stale selected context immediately before system transform without weakening the message-before-transform contract.
- **Approach**: Mutate promoted evidence after `chat.message`, require transform to drop the cached card, restore the evidence bytes, then preserve omission until a new message explicitly reselects the card before testing second-process invalidation.
- **Evidence**: The first fresh SDET chain passed the new fingerprint fail-closed and cross-project isolation assertions but failed when the test expected transform itself to synthesize re-selection after evidence restore. The corrected test asserted continued omission, invoked a new message, and then the complete direct/hook/focused chain exited `0`.
- **Outcome**: Test-only sequencing defect corrected; no Product Candidate defect reproduced. The unique fingerprint and cross-project oracles are retained.
- **Reason**: `currentSelection` revalidates only existing selected refs and deletes an empty selection; selection ownership remains `chat.message`.
- **Do Not Repeat Until**: The accepted hook contract changes to permit transform-time selection.
- **Evidence-Based Retry Condition**: If that contract changes, update the test and loaded oracle together before expecting restored evidence to appear without a new message.

## 2026-08-25 - Evidence Challenge Narrows Combined Boundary To Named Scenarios

- **Objective**: Close `PMC-001` without representing provider-free-only members as loaded or treating 22 named scenarios as exhaustive interaction coverage.
- **Approach**: Freeze the production/runner/test identities, bind every member to current evidence, run one fresh read-only evidence-sufficiency challenge, reproduce all ten rows, and replace the rejected combined runtime stamp with a scenario-specific evidence-package identity.
- **Evidence**: Reviewer session `ses_fc4e69b05ffeAu65lFsJBWTXmr` found the pre-review combined boundary unsupported. Main confirmed lane-specific runner drift and predecessor refs, labeled seed file/canonical digests separately, disproved the alleged missing privacy substitution at `project-memory-context.ts:313-323`, and rehashed the unchanged candidate/runner/tests after review. `task-4-3-evidence-sufficiency-r1.md` records every disposition.
- **Outcome**: Evidence disposition `narrowed`; all 22 named scenarios remain supported only at their cited provider-free, full-envelope, loaded, or SDET boundaries. Loaded R2 is limited to its 25 terminal checks; uncited interactions remain residual.
- **Reason**: Evidence package closure is valid only when each lane retains its recorded identity and no aggregate label implies every scenario ran under pinned OpenCode.
- **Do Not Repeat Until**: A current real boundary is added for a previously provider-free-only scenario or the declared partition changes.
- **Evidence-Based Retry Condition**: Add only the distinct member/boundary evidence identified by a reproduced requirement gap, then rerun a fresh challenge against the changed matrix.

## 2026-08-25 - Final Package Proof Seed Tracks Retained SDET Oracle

- **Objective**: Run the maintained package proof with the frozen runner and post-SDET focused test population.
- **Approach**: Preserve the failed package R1, compare exact expected and observed pass-name lists, add only the retained cross-project isolation test name to the reviewed seed, and run a fresh package R2.
- **Evidence**: R1 passed every product/scoring/privacy/hook check but failed `process-direct` because it observed nine direct tests while the seed expected eight. R2 used seed file hash `f27774d45a678099ba47faab6a04cddbb5c6aeac34e5719d62fd58108c23da5d`, completed all checks, and preserved cleanup/no-side-effect facts.
- **Outcome**: Selected R2 as current-runner provider-free package evidence; no Product Candidate mutation or defect.
- **Reason**: The SDET added one unique test oracle, so the deterministic reviewed process-output inventory had to include that exact name.
- **Do Not Repeat Until**: The focused test population or runner identity changes.
- **Evidence-Based Retry Condition**: Reconcile only a reviewed exact pass-name drift; a behavioral failure requires product/test diagnosis instead of seed expansion.
