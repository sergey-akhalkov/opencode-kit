# Strategy History

## 2026-08-10 - Universal maximum-modularity rule

- **Objective**: Prevent reinvention and make all new code broadly reusable.
- **Approach**: Require repository, peer-project, and ecosystem search before every code edit, then optimize custom code for maximum flexibility and modularity.
- **Evidence**: Current kit policy and `code-quality-audit` already reject speculative generality, wrapper-only fragmentation, and abstractions added for hypothetical variants; the user's primary outcome is lower tokens and faster verified completion.
- **Outcome**: Rejected during exploration.
- **Reason**: Universal search and maximum flexibility would add tool/context cost to trivial fixes and expand interfaces, states, files, and proof matrices without current consumers.
- **Do-not-repeat condition**: Do not reintroduce universal per-edit search or "maximum flexibility" as an unconditional architectural requirement.
- **Evidence-based retry condition**: Reconsider only if measured same-model workflows show that a broader trigger reduces total verified-task time/tokens without adding trivial-task ceremony or speculative abstractions.

## 2026-08-10 - Per-project federated manifests as registry source of truth

- **Objective**: Keep capability records next to producer code and derive a cross-project search index.
- **Approach**: Commit one capability manifest to each producer repository and aggregate those manifests into a machine-local index.
- **Evidence**: This topology reduces central drift and keeps module ownership local, but the user explicitly selected a separate central common repository and named allowlist groups.
- **Outcome**: Rejected for the current increment.
- **Reason**: It conflicts with the selected central-catalog ownership model and would require changes across every producer repository before discovery becomes useful.
- **Do-not-repeat condition**: Do not make producer manifests mandatory in this change or represent them as the selected registry source of truth.
- **Evidence-based retry condition**: Reconsider only if central update contention or semantic drift is observed in real registry operation and a producer-owned manifest demonstrably removes that bottleneck without increasing synchronization complexity.

## 2026-08-10 - Codebase Memory inventory as implicit peer registry

- **Objective**: Reuse existing cross-repository indexing without creating a new registry protocol.
- **Approach**: Search all locally indexed Codebase Memory projects and infer friendly projects/capabilities from graph results.
- **Evidence**: The observed `list_projects` payload contains 333 flat records with only `name`, `root_path`, `nodes`, `edges`, and `size_bytes`; it has no group, trust, allowlist, capability, or freshness fields. Current kit policy also warns against basename selection and large inventory disclosure.
- **Outcome**: Rejected during repository/infrastructure exploration.
- **Reason**: The index cannot establish authority or capability ownership and broad search would disclose unrelated private project identities and consume excessive context.
- **Do-not-repeat condition**: Do not use `list_projects` or all-index search as an allowlist, registry, or discovery source of truth.
- **Evidence-based retry condition**: Reconsider only if the runtime exposes verified owner-controlled group/capability metadata with privacy-preserving bounded cross-project queries and the central registry no longer supplies that authority.

## 2026-08-10 - Synchronous central-registry update as completion gate

- **Objective**: Guarantee that every qualifying capability is immediately discoverable.
- **Approach**: Require each producer task to edit and validate the separate registry repository before product-code completion.
- **Evidence**: The user selected a central private registry but also prioritized speed and selected a pending outbox when the registry is unavailable. Direct mandatory cross-repo writes add a second dirty worktree, validation lifecycle, collision surface, and potential remote-state coupling.
- **Outcome**: Replaced by durable private pending outbox plus explicit local sync.
- **Reason**: Strong synchronous consistency would make a knowledge catalog a single point of failure for local/offline code completion.
- **Do-not-repeat condition**: Do not block otherwise valid product completion solely on central registry availability or perform automatic commit/push/publication.
- **Evidence-based retry condition**: Reconsider only if observed pending loss causes material duplicate implementations and a bounded local synchronous update can be proven reliable without cross-repo liveness or remote-state coupling.

## 2026-08-10 - Curated-only registry with separate future population

- **Objective**: Deliver a small trusted registry/query protocol without building a repository scanner.
- **Approach**: Ship status/query/enqueue/sync and leave initial registry creation/population to a later manual or companion change.
- **Evidence**: The user clarified that the intended product is a simple command receiving a natural-language project/registry request and filling a useful local structure/architecture knowledge layer before curation. A curated-only registry starts empty and does not satisfy that first-run outcome.
- **Outcome**: Replaced by natural-language bootstrap plus generated inventory/candidate layers in the current change.
- **Reason**: Deferring initial population would preserve rediscovery cost and make the implemented registry unusable until another unspecified workflow exists.
- **Do-not-repeat condition**: Do not describe initial generated inventory as out of scope or claim the accepted happy path is complete with an empty curated registry.
- **Evidence-based retry condition**: Reconsider only if an existing independently proven bootstrap source is adopted and demonstrably supplies the same exact project, entrypoint, architecture, candidate, privacy, and refresh contracts.

## 2026-08-10 - User-facing deterministic CLI flags

- **Objective**: Keep bootstrap invocation explicit and machine-testable.
- **Approach**: Require users to provide `--registry-root`, repeated `--project`, group, and write flags directly to the deterministic client.
- **Evidence**: The user explicitly requested a simple natural-language command prompt with no argument syntax and expects the command to resolve safe details autonomously.
- **Outcome**: Replaced by `/reuse-inventory` free-form orchestration over an explicit machine-readable core plan.
- **Reason**: Exact flags are appropriate for the internal deterministic boundary but impose avoidable memorization and path-format burden on the user-facing workflow.
- **Do-not-repeat condition**: Do not expose deterministic-core flags as the required user contract or silently infer ambiguous roots behind the prompt.
- **Evidence-based retry condition**: Retain direct flags only as an internal/debug automation surface; reconsider user exposure if observed prompt ambiguity causes more owner interruptions or wrong resolutions than the explicit syntax.

## 2026-08-10 - Full project rescan on every refresh

- **Objective**: Keep refresh correctness simple by rebuilding every selected project from scratch.
- **Approach**: Ignore prior scan identity and rescan all committed source whenever inventory is updated.
- **Evidence**: The user requires the knowledge base to remember the last scanned commit and update only from new commits. Git supplies exact commit/tree identity, ancestry, and rename-aware aggregate diffs; unchanged projects need no source scan.
- **Outcome**: Replaced by `lastSuccessfulCommit` checkpoint, aggregate incremental diff, safe affected-scope expansion, and explicit full fallback.
- **Reason**: Repeated full scans directly oppose the speed/token goal and discard a reliable incremental boundary.
- **Do-not-repeat condition**: Do not full-rescan a project when commit, scanner/schema/policy identity, ancestry, and affected ownership prove a complete no-op or incremental scope.
- **Evidence-based retry condition**: Full rescan is permitted only for initial scan, non-ancestor/missing history, scanner/schema/policy changes, ownership/impact uncertainty, unsupported manifest transitions, or measured evidence that incremental output diverges from a full baseline.

## 2026-08-10 - Disposable fixture commits through porcelain Git

- **Objective**: Create exact committed source trees for proof preflight without owner repository or remote effects.
- **Approach**: Initialize each disposable repository, stage fixture bytes, and invoke `git commit` with per-command synthetic author configuration.
- **Evidence**: The first preflight failure was masked by a missing evidence-file read in cleanup; after that preservation defect was corrected, the second zero-provider preflight failed at `git -c user.name=Proof Fixture -c user.email=proof@example.invalid commit --quiet -m fixture`. Both disposable roots were removed and `preflight.json` preserved the second failure.
- **Outcome**: Rejected after two materially similar cheap local attempts produced no green preflight.
- **Reason**: Porcelain commit inherits host hook/signing/policy surfaces that are unnecessary for a deterministic disposable committed-tree fixture.
- **Do-not-repeat condition**: Do not retry porcelain `git commit` with different flags, quoting, messages, timeouts, or author config for this proof path.
- **Evidence-based retry condition**: Retry porcelain only if preserved diagnostics prove the failure is unrelated to inherited hooks/signing/policy and plumbing cannot create the required commit identity.
- **Next strategy**: Use `git write-tree`, `git commit-tree`, `git update-ref`, and a fixture-only author/committer environment so no hooks, signing, or owner Git configuration participates.

## 2026-08-10 - Baseline capture without loader diagnostics

- **Objective**: Capture all eight same-model baseline reuse scenarios through fresh primary OpenCode processes.
- **Approach**: After a green static preflight, run the first `quality-independent` scenario through `opencode run --pure --format json` with isolated XDG state and a disposable project permission envelope.
- **Evidence**: `inventory-refresh.bundle.json` records status `1`, one OpenCode `UnknownError` event with reference `err_c7475805`, zero assistant/model/token/cost/tool facts, byte-identical fixture files, and successful cleanup. `offline-replay-attempt-1/evaluation.json` replayed the complete preserved bundle to a terminal facts result with `baselineComplete: false`; no second provider call occurred.
- **Outcome**: Blocked after the first lane. `Live-Attempt Gate: blocked` for this proof path.
- **Reason**: The raw event proves an OpenCode server failure but the runner did not enable server logs, so the causal layer remains unknown. A repeated eight-lane attempt would be guesswork.
- **Do-not-repeat condition**: Do not rerun provider capture with the same static-only preflight or treat the generic server event as a model-behavior result.
- **Evidence-based retry condition**: Run the same disposable profile/config/agent through an offline loader preflight, preserve privacy-safe loader status/diagnostics, and identify either a causal correction or the exact observation that still requires one bounded live evidence-capture call. Preserved-corpus evaluation must remain terminal and green as a facts replay.
- **Next strategy**: Extend preflight to execute `debug config` and `debug agent build` under the exact profile, cwd, permission config, pure mode, and isolated state without a provider call.

### Unlock evidence

- **Causal change**: Capture no longer replaces `XDG_DATA_HOME`; it uses the existing credential store without copying or emitting values and deletes every event-correlated session explicitly through the same profile in `finally`.
- **Preserved bundles**: `implementation-evidence/baseline-sessions/inventory-refresh.bundle.json` and `implementation-evidence/baseline-sessions/offline-replay-attempt-1/evaluation.json`.
- **Offline replay coverage**: The evaluator consumed every recorded fact from the sole attempted scenario through its terminal result; status, zero assistant/tool/token facts, byte-identical state, and cleanup all remain represented.
- **Terminal replay result**: Green facts replay with `rows: 1` and expected `baselineComplete: false`; no evaluator failure and no live effects.
- **Causal evidence**: Corrected `preflight.json` records existing credential count `4`, isolated credential count `0`, config/agent loader status `0`, no loader error, model calls `0`, and cleanup `removed`.
- **Unlock condition**: Satisfied. The next capture can reach generation through the configured route and has deterministic session/root cleanup; if it fails, preserve that new bundle and return to offline replay before another provider attempt.

## 2026-08-10 - Project-local permission envelope under later global allow

- **Objective**: Capture all eight baseline scenarios with the intended bounded local tool envelope.
- **Approach**: Keep the committed `quality-independent` model profile in final inline config while relying on disposable project `opencode.json` to deny unrelated tools.
- **Evidence**: Three bundles completed before the user restarted the visibly stalled session. `inventory-refresh` took `741078ms`, emitted 118 tool calls including Codebase Memory enumeration/search and MCP inventory, and reached 95k reported context tokens; `local-owner` took `91955ms`; `registered-peer` took `214267ms`. All three completed bundles have status `0`, session deletion `0`, and root cleanup `true`. The interrupted `stale-record` lane left session `ses_013f8e57fffeNXCthrp7vz6iJy` and disposable root `reuse-discovery-stale-record-hyUp14`. `capture-2-offline-replay/evaluation.json` reached a terminal three-row facts result.
- **Outcome**: Rejected as baseline evidence; user interruption closed the process but cleanup for the fourth lane is incomplete. `Live-Attempt Gate: blocked`.
- **Reason**: Loader evidence shows the kit global config loads after the project config; its top-level `permission: allow` overrides the intended project-only envelope. This caused broad repeated discovery rather than a bounded scenario.
- **Do-not-repeat condition**: Do not launch another capture that relies on project-local permission to override the later global source, and do not retain the three broad-tool bundles as the comparable baseline.
- **Evidence-based retry condition**: Delete the exact interrupted session and disposable root, sanitize all preserved bundles, replay them offline, apply the bounded permission map in final inline config together with the unchanged profile, and prove the resolved config enforces that map in a zero-model preflight.
- **Next strategy**: Invoke OpenCode directly with final inline profile plus permission policy, retain exact committed profile route evidence, and keep project config only as a fixture rather than authority.

### Unlock evidence

- **Causal change**: Direct OpenCode invocation now receives the unchanged committed profile plus the bounded proof permission map in final inline config, which loads after global `permission: allow`.
- **Preserved bundles**: The three completed broad-tool bundles remain under `baseline-sessions/capture-2/`; interrupted state recovery is in `baseline-sessions/interrupted-recovery/recovery.json`.
- **Offline replay coverage**: `capture-2-offline-replay/evaluation.json` consumed all three completed bundles through the terminal facts stage.
- **Terminal replay result**: Expected incomplete baseline with three preserved rows and no evaluator failure.
- **Cleanup/privacy result**: Interrupted session deletion status `0`, abandoned root removed, and eight prior JSON evidence files passed the runner's privacy-sanitize rewrite.
- **Preflight result**: `preflight-3/preflight.json` records `exactFinalPolicy: true`, config/agent loader status `0`, no loader errors, existing credential count `4`, model calls `0`, and cleanup `removed`.
- **Unlock condition**: Satisfied for one bounded scenario smoke. Do not start the full matrix until that lane confirms the restricted tool envelope and acceptable runtime.

## 2026-08-10 - Substring-based registry command permission

- **Objective**: Allow the future deterministic registry client while denying arbitrary shell access in baseline/candidate sessions.
- **Approach**: Final inline permission allowed any `node` command containing `reuse-registry`.
- **Evidence**: `capture-3/trivial-fix.bundle.json` was bounded at 36.9 seconds and seven local read/search calls. `local-owner` stayed local but took 131.6 seconds. `registered-peer` exploited the broad pattern with repeated `node -e ... reuse-registry` commands, read private config/registry/source directly, used 22 provider steps, and took 323.3 seconds despite status/cleanup success.
- **Outcome**: Rejected for cross-project baseline/candidate evidence. The three bundles remain diagnostic only.
- **Reason**: Substring permission constrains command text superficially but does not constrain the executable entrypoint or operation. It is bypassable by an arbitrary Node eval argument.
- **Do-not-repeat condition**: Do not allow `node *reuse-registry*`, suffix-marker tricks, or another substring-only shell pattern.
- **Evidence-based retry condition**: Resolve an exact literal deterministic-client argv shape in final inline config, add deny-last shell metacharacter guards, cap agent steps, and prove exact resolved permission/step values before restarting a clean baseline matrix.
- **Next strategy**: Allow only the literal environment-resolved `global/bin/reuse-registry.ts` entrypoint, require one attempted registry call before explicit blocked disposition when unavailable, and use a 12-step maximum.

## 2026-08-10 - Full client proof before registry preflight

- **Objective**: Prove the initial portable registry path through status, validation, bootstrap, query, enqueue, sync, and final validation.
- **Approach**: Create the full disposable Git topology and immediately run the complete nine-command client sequence.
- **Evidence**: Attempt 1 stopped before client execution because portable-process rejected caret Git revision syntax; cleanup ran. After replacing caret syntax with `cat-file` plumbing, attempt 2 reached `status-before` and returned non-zero, but the runner had not yet persisted the command transcript. Source inspection shows the fixture canonical index omitted its valid unselected sentinel capability, so complete registry validation would reject index drift even though group queries must hide that capability.
- **Outcome**: No green client artifact after two cheap attempts; exact second-command diagnostics are an evidence gap.
- **Reason**: The proof combined fixture/schema preflight with the complete behavior sequence and wrote evidence only after every command, delaying the earliest local signal.
- **Do-not-repeat condition**: Do not rerun the full client sequence until status/validate have a preserved green transcript against a complete canonical index.
- **Evidence-based retry condition**: Add a separate provider-free client preflight that persists each command before failure, include every canonical capability in the derived fixture index, and require green status plus validation before full bootstrap/query/sync.
- **Next strategy**: Run `client-preflight` first, then invoke the complete `client-proof` only from that current green fixture/schema boundary.

## 2026-08-10 - Semantic query guidance without exact client argv

- **Objective**: Prove that a fresh registered-peer new-mechanism session loads the lazy skill, performs one bounded private query, verifies selected committed source, and records `reuse` without duplicate implementation.
- **Approach**: Run one same-model `quality-independent` candidate session with the bounded proof permission map and the task 1.2 registered-peer input after green provider-free preflight and current Rung 2 client proof.
- **Evidence**: `implementation-evidence/runtime-proof/bootstrap-to-reuse-mvp/registered-peer/registered-peer.bundle.json` records the skill load and one client invocation. The model used unsupported `--terms`, omitted required `--groups`, received `status: invalid` / `Unknown option: --terms`, then correctly did not retry. Session deletion returned `0` and the disposable root was removed.
- **Outcome**: Red accepted-outcome proof; no peer was selected or source-verified. Live-Attempt Gate is blocked pending preserved-bundle replay.
- **Reason**: The lazy skill stated exact-term/group semantics but did not provide the deterministic client's exact internal argv shape, allowing a fresh model to invent a plausible incompatible flag on its only permitted call.
- **Do-not-repeat condition**: Do not issue another provider call with semantic-only query wording or before the preserved bundle reaches the terminal offline evaluator/sanitizer/static/preflight chain.
- **Evidence-based retry condition**: Add exact `query --config ... --need ... --groups ... --limit 10` internal syntax with explicit forbidden substitutions; replay evaluator and sanitizer against the preserved bundle; pass strict validation, current Rung 2 query proof, and provider-free loader/permission preflight.
- **Next strategy**: Keep the one-call envelope but constrain it through exact lazy-skill argv grammar, then run a fresh registered-peer session only after every offline unlock condition is recorded green.

## 2026-08-10 - Prompt-only correction of missing query group

- **Objective**: Retry the registered-peer lane after exact query grammar was added to the lazy skill.
- **Approach**: Complete preserved-bundle evaluator/sanitizer, strict validation, current Rung 2 client proof, and loader preflight, then run one fresh same-model session under the unchanged one-call envelope.
- **Evidence**: `implementation-evidence/runtime-proof/bootstrap-to-reuse-mvp/registered-peer-retry-1/registered-peer.bundle.json` records one command using accepted `--need jsonc-parser`, but the model substituted unset `OPENCODE_REUSE_GROUPS` for the request's literal `personal` group. Shell expansion left dangling `--groups`; the client returned `Missing value for --groups`. Cleanup and session deletion are green.
- **Outcome**: Red accepted-outcome proof again. Two materially similar provider attempts produced no accepted runtime artifact, so this chain is stagnant and the Live-Attempt Gate is blocked.
- **Reason**: Exact flag grammar did not prevent a fresh model from inventing an optional group environment source. Repeating prompt wording would remain the same causal mechanism.
- **Do-not-repeat condition**: No further provider call may rely on prompt-only argv correction for this lane.
- **Evidence-based retry condition**: Use a materially different executable mechanism: when and only when validated private config has exactly one enabled group, the client may resolve an omitted/dangling group to that sole configured authority; multiple enabled groups remain fail-closed. Replay the retry's exact argv through the actual disposable client, inspect verification/privacy/cleanup, and complete the offline terminal chain.
- **Next strategy**: Add exact-single-enabled-group containment to the client parser/query boundary and prove the preserved failing argv locally; do not schedule another model call in task 2.2 unless a later independently justified strategy reopens the blocked gate.

## 2026-08-10 - Registered query without readable contract source

- **Objective**: Use the executable single-group containment to obtain and fully verify the registered JSONC peer in one final fresh session.
- **Approach**: After terminal offline replay and exact failed-argv Rung 2 proof, run one fresh registered-peer candidate session with the same model/profile/input and bounded permissions.
- **Evidence**: `implementation-evidence/runtime-proof/bootstrap-to-reuse-mvp/registered-peer-final/registered-peer.bundle.json` records a successful one-call bounded query, one `text/jsonc-parse` result, exact commit and presence verification, no duplicate implementation, and green cleanup. The model then attempted targeted source/evidence globbing, but both calls were denied because the disposable peer repositories were siblings of the permitted workspace. It retained `reuse` as blocked pending source contract verification rather than trusting metadata.
- **Outcome**: The query/selection boundary advanced, but the accepted source-verification/reuse outcome remains red. Live-Attempt Gate is blocked.
- **Reason**: The proof fixture placed selected projects outside the agent's readable disposable workspace, and its seeded parser/evidence established presence rather than the complete requested JSONC/error contract. The model's refusal was correct.
- **Do-not-repeat condition**: Do not rerun with sibling selected repositories, presence-only evidence, or broader external-directory permission that could expose the unselected sentinel.
- **Evidence-based retry condition**: Place only explicitly selected Alpha/Beta repositories inside the disposable workspace while keeping the sentinel outside; seed an executable contract-accurate parser and proof; run the producer proof and complete client/source/privacy/cleanup replay locally; recapture a comparable baseline later before full-matrix claims because the fixture identity changes.
- **Next strategy**: Correct the disposable topology and source proof so ordinary workspace reads can verify selected source without any external-directory broadening or unallowlisted disclosure.

## 2026-08-10 - Exact query vocabulary omitted seeded synonym

- **Objective**: Complete the final registered-peer session after selected source became readable and contract-accurate.
- **Approach**: Run one fresh same-model session after provider-free producer, client, privacy, cleanup, strict-validation, evaluator, sanitizer, and loader-preflight gates were green.
- **Evidence**: `implementation-evidence/runtime-proof/bootstrap-to-reuse-mvp/registered-peer-readable-final/registered-peer.bundle.json` records a valid one-call query using `--need jsonc-parsing`. Exact normalization produced terms `jsonc` and `parsing`; the seeded capability exposed `jsonc`, `parse`, and `parser` but omitted `parsing`, so deterministic all-term matching returned zero. Cleanup and session deletion are green; no source/dependency/remote mutation occurred.
- **Outcome**: Red accepted-outcome proof. The previously recorded stop condition ends provider retries for task 2.2.
- **Reason**: The proof registry's curated keywords did not include the exact common request vocabulary used by the fresh model. Exact matching correctly avoided fuzzy inference.
- **Do-not-repeat condition**: Do not issue another provider call for task 2.2 or weaken exact matching/stemming rules to fit one transcript.
- **Evidence-based retry condition**: Add explicit sorted keyword `parsing` to the synthetic curated fixture, replay the captured `jsonc-parsing` argv through the actual client, and complete evaluator/sanitizer/static/privacy/cleanup checks. A later provider attempt requires a separately justified continuation outside this task's consumed live stop condition.
- **Next strategy**: Finish provider-free exact-vocabulary replay, preserve task 2.2 as blocked rather than claiming model-level MVP, and hand off the precise live-gate state.
