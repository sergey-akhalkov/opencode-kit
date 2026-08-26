## Context

See `proposal.md` for motivation and the bounded claim. The loaded owner is `global/plugin/session-env.ts`, which already composes environment, pre-tool, and custom-tool behavior. Privacy-safe text handling lives in `global/plugin/session-delivery-context/redaction.ts`. Git-tracked `.serena/memories/` already provides a curated progressive-discovery graph, while session compaction preserves current-task continuity but cannot write durable memory.

The change must remain self-contained under `global/plugin/`, add no dependency or plugin entry, preserve all existing hooks, and keep machine-local learned records out of project worktrees. Active changes currently touch adjacent session-delivery, installation, and runtime-validation surfaces, so implementation must recheck ownership and serialize any overlap before mutation.

## Goals / Non-Goals

**Goals:**

- Extend the existing plugin composition owner without adding another configured plugin or MCP process.
- Keep reusable learned cards local, explicit, append-only, human-readable, privacy-safe, and cheap to inspect or recover.
- Treat L0 global instructions and L2 current-task state as existing owners; add only a bounded L1 project core and L3 recalled-memory capsule.
- Make ranking and every admission/exclusion decision deterministic and provider-free.
- Fail closed for uncertain root identity, stale evidence, unsafe paths, and incomplete corpus enumeration while preserving unrelated OpenCode behavior.

**Non-Goals:**

- Building a semantic-memory platform, shared synchronization service, project bootstrap workflow, transcript miner, memory editor UI, or replacement for Serena/OpenSpec/Codebase Memory.
- Making curated Serena memories conform to the local card schema or automatically promoting local cards into Git-tracked memories.
- Optimizing beyond the measured 2,000-card/10,000-event envelope before the direct scan proves insufficient.

## Decisions

### 1. Extend `session-env` and build one co-located module

Ownership choice: `extend` the current `session-env` plugin composition owner, `reuse` the existing redaction and privacy-safe reference functions, and `build-minimal` under `global/plugin/project-memory/` because no current owner combines card persistence, ranking, and capsule rendering. Cross-project discovery is `verified`: OpenCode's native plugin hooks and the reviewed Mem0 plugin pattern cover the integration need, while an external memory dependency adds privacy, availability, migration, and tool-surface cost without improving the bounded local claim.

`session-env.ts` will import only the project-memory public entry point and compose its tool and hook fragments with existing hooks. The new directory will initially contain:

- `index.ts`: public types, feature construction, tool definitions, and hook-facing operations.
- `store.ts`: data-root resolution, strict Markdown event parsing, envelope checks, append operations, and status folding.
- `recall.ts`: tokenization, ranking, freshness/fingerprint eligibility, Serena reads, and bounded rendering.

This split follows persistence, selection, and integration responsibilities rather than introducing reusable abstractions. If implementation shows one file remains clearer, it may collapse files without changing the contract.

Alternative: register a standalone plugin. Rejected because it requires config, installer, validator, doctor, and profile changes while `session-env` already owns self-contained global tools and hook composition.

Alternative: add a memory MCP. Rejected because no separate process or cross-language boundary is needed and it would duplicate project authority and lifecycle handling.

### 2. Use existing context owners and add only L1/L3

The context pyramid is:

- L0: global instructions and safety policy, unchanged by this feature.
- L1: up to 2 KiB read directly from current `.serena/memories/core.md` when present.
- L2: the current task and session continuity already owned by OpenCode messages, todos, and compaction.
- L3: zero to seven current recalled items using the bytes remaining inside one total 8-KiB capsule after the header, warnings, and maximum 2-KiB L1 core.
- L4: cold active cards, candidates, and non-matching curated files, retained outside prompt context.
- L5: immutable lifecycle events, evidence refs, and invalidated records, read only for explicit status or re-verification.

The rendered capsule is advisory and labels every item with a privacy-safe ref and source class. It explicitly states that current user instructions, source, specs, and runtime evidence win. No low-score result is added merely to reach a minimum count.

Alternative: inject a complete `tips-and-tricks.md`. Rejected because one growing file has no deterministic relevance, freshness, or token control.

### 3. Bind identity and immutable events to fixed filesystem slots

The module will choose the first non-empty identity from `PluginInput.worktree`, `PluginInput.project.worktree`, and `PluginInput.directory`, then canonicalize it with `realpath`. A session directory, when present, must remain beneath that root; it never selects another store. Linked Git worktrees intentionally receive separate stores because their canonical worktree paths and potentially changing source differ.

The store key is `project_` plus the first 32 hex characters of SHA-256 over the canonical root. The longer project key avoids using the existing 12-hex diagnostic ref as a storage isolation boundary. Diagnostics continue to expose only a privacy-safe ref. The layout is:

```text
<opencode-data>/project-memory/v1/<project-ref>/
  cards/card-0000.md ... card-1999.md
  events/event-000000.md ... event-007999.md
```

The one write root uses exact platform precedence: explicit `OPENCODE_DATA_DIR`; otherwise `LOCALAPPDATA/opencode` then `APPDATA/opencode` on Windows, `~/Library/Application Support/opencode` on macOS, and `XDG_DATA_HOME/opencode` then `~/.local/share/opencode` elsewhere. Explicit relative values resolve against the plugin startup directory before use. This is a project-memory data root, not a promise to colocate records with `opencode.db`. The store never writes a reverse mapping to the absolute project root.

Each event is Markdown with one strict fenced JSON metadata block and required human-readable sections. JSON metadata avoids a new YAML dependency and gives deterministic parsing while the surrounding record remains reviewable. Candidate metadata carries schema version, card/event refs, title, kind, timestamps, confidence, triggers, repository-relative `applies_to` selectors, and evidence descriptors. Candidate body sections are `Technique`, `Why`, `Evidence`, and `Invalidated When`. Promotion events snapshot current repository-path fingerprints and verification time; invalidation events contain a non-empty reason.

Candidate creation scans the 2,000 fixed card slot names and attempts `writeFile(..., { flag: "wx" })` until one succeeds or capacity is exhausted. Promotion/invalidation does the same across 8,000 lifecycle slots. The slot file is the immutable semantic event, so there is no separate reservation that can diverge after a crash. A partially written crash file consumes its slot, counts toward the envelope, and is quarantined as malformed; no tool deletes it. This enforces the card/event write limits even when two processes race at the final slot.

Every event also carries a cryptographically random ref. The store never edits or deletes an event. Folding rules are monotonic: any valid invalidation makes the card terminal; otherwise one or more promotions make it active; otherwise it remains a candidate. Duplicate promotions and invalidations are idempotent. There is no in-place edit or atomic correction action in this increment; users can explicitly create another candidate and separately invalidate the old card, with each action independently observable.

Alternative: one mutable card file plus a generated index. Rejected because cross-process compare-and-swap and crash recovery add a lock/pointer protocol. Immutable unique events make concurrent appends non-overwriting and make the complete history the source of truth.

Alternative: SQLite or a vector database. Rejected because the bounded corpus needs neither and Markdown is the required inspectable source of truth.

### 4. Rank with lexical and structured signals before adding semantics

Recall will normalize Unicode text with NFKC, lowercase it, and split Unicode letter/number terms plus camel-case boundaries. The scoring corpus is current active local cards plus safe current curated files except `core.md`, after non-query eligibility filters. It calculates BM25 per field with `k1=1.2`, `b=0.75`, and weights `title=3`, `triggers=3`, `applies_to=4`, `body=1`; a curated title is its relative memory name plus first H1. Exact normalized trigger phrases add `8`, and exact repository-relative paths or symbols add `10`. Admission requires an exact metadata signal or at least two distinct matched query terms plus weighted BM25 of `1.0`. Rank order is exact path/symbol, total score, local confidence (`high`, `medium`, `low`; curated uses `medium`), verification time descending (curated uses file mtime), source label, then ref.

Automatic eligibility requires active status, verification no older than 180 days, valid schema and limits, safe repository-relative selectors, and matching fingerprints for declared local evidence paths. Explicit recall may include excluded statuses on request but must report why they are ineligible. Serena files are read from their current source on every bounded corpus refresh and remain distinctly labelled as curated rather than treated as promoted local cards.

The renderer reserves the precedence header and warnings, adds at most 2 KiB of redacted `core.md`, then visits ranked non-core items once and stops at seven results or 8 KiB total capsule bytes. It reports omitted counts. The implementation will use a direct bounded scan first; an in-memory cache may retain parsed records only when directory metadata proves it fresh. No persisted derived index is needed for this increment.

Alternative: embeddings plus lexical fusion. Deferred until a measured accepted-query miss demonstrates vocabulary-only failure that structured lexical signals cannot resolve. Adding embeddings now would require a model, storage, freshness, privacy, and broad-equivalence program outside `PMC-001`.

### 5. Coordinate selection through root-verified plugin hooks

Activation is captured once inside the plugin server factory. The disabled path and an incomplete factory input return existing hooks without dereferencing memory-specific `client`, `worktree`, or `directory` fields, preserving current `plugin.server({} as never)` fixtures. The enabled path validates the canonical worktree before registering the two tools or memory hooks; it reuses already-exported `sanitizeText` and privacy helpers without changing the shared redaction API.

On `chat.message`, the module verifies the session with the pinned client's `session.get` API, a one-second deadline, no retry, no `parentID`, and a contained session directory. It uses text parts from that human message ephemerally, calculates the selection, and retains only rendered bounded context, card refs, warnings, and truncation state in a process-local map keyed by session id. Lookup failure or timeout is treated as non-root for this feature and emits one `console.warn` per safe failure reason/session ref, with no raw id or path and no second client request.

`experimental.chat.system.transform` requires a matching session id and prior `chat.message` selection. Before appending, it re-folds selected local refs and re-reads selected/core Serena sources, rechecks time/fingerprints/containment, removes ineligible content, and re-renders. `experimental.session.compacting` performs the same revalidation before appending to `output.context` without replacing the default prompt. Newly added cards wait until the next human message. Session-deletion events and plugin disposal clear process-local state; manage actions also clear affected local caches.

The pinned runtime is required to call `chat.message` before system transformation for one request. Focused hook tests cover missing/reversed order as no-injection, and the first loaded-entry proof records actual order. If the pinned runtime does not provide it, implementation stops at the hook-integration boundary and updates the design rather than reading full transcripts as a fallback.

The plugin will register exactly `project_memory_recall` and `project_memory_manage` only when enabled. Recall takes a query plus optional safe path, symbol, status, and limit. Manage uses a discriminated action schema for candidate, promote, or invalidate. Both tools return versioned JSON with cause-preserving errors; recall output is capped at 16 KiB and manage output at 4 KiB.

Alternative: inspect the full message history in the system-transform or compaction hook. Rejected because it expands sensitive input and duplicates session-delivery ownership. The latest human prompt is already available at `chat.message`, and compaction needs only the selected capsule.

### 6. Treat Serena as a bounded current read-only source

The module uses filesystem reads rather than a Serena MCP call, so local recall does not depend on server availability. It enumerates only regular `.md` files under the resolved `.serena/memories/` directory, rejects symlinks and escapes after resolution, and enforces 100-file/512-KiB bounds before ranking. `core.md` contributes L1 context only and is excluded from L3 candidates; other current files participate in L3 ranking. All snippets are redacted before output or injection.

No local-card action writes to Serena. Shared promotion remains an intentional human-reviewed edit through the existing Serena memory workflow and referential-integrity check.

Alternative: use Serena's memory tools from inside the plugin. Rejected because plugin-to-MCP invocation would add runtime availability, recursion, and authority coupling for files that are already locally readable.

### 7. Preserve privacy and bounded failure diagnostics

The module wraps `sanitizeText` with `sanitizeMemoryText(value, canonicalRoot)`. The wrapper first replaces case-insensitive native and slash-normalized canonical-root prefixes with `<project-root>`, then applies existing credential, home-path, and session redaction. It is used for candidate text, curated snippets, tool output, capsules, and diagnostics. Selectors reject absolute paths, drive-qualified paths, UNC paths, and parent traversal before filesystem access. Path evidence is resolved beneath the canonical root and hashed at promotion; the persisted descriptor retains only the repository-relative path and content digest.

Automatic-hook failures produce one bounded warning state for that selection and no memory injection. Tool failures return the original error cause with safe operation/card refs. A malformed card is quarantined individually; inability to prove the complete local population is within bounds suppresses all local automatic results rather than silently ranking a partial corpus. Curated and local sources fail independently.

The feature performs no provider or external-network operation. Automatic root verification uses only the pinned local OpenCode client, while provider-free tests stub that client and use an external-egress canary plus a disposable Git worktree to prove the bounded negative claim. Unknown secret formats remain outside the maximum claim in `PMC-001`.

## Risks / Trade-offs

- [Lexical recall misses vocabulary-only relationships] → Keep path/symbol/trigger boosts, preserve explicit recall, and add semantics only after a reproduced accepted-query miss.
- [Redaction misses an unknown secret format] → Restrict fields and sizes, reject unsafe selectors, reuse current redaction, avoid transcripts, and keep secret-detection completeness outside the claim.
- [Curated Serena text is stale despite being current on disk] → Label it advisory/curated, cap it, and keep source/spec/runtime precedence explicit; manual Serena maintenance remains the owner.
- [Direct scans become slow near 2,000 cards and 10,000 events] → Capture latency in the corpus runner and add only a derived index if the measured boundary is insufficient.
- [OpenCode hook order or session shape changes] → Pin to the repository plugin API, test the actual exported hook composition, and fail closed when root identity is unavailable.
- [Concurrent processes append conflicting state] → Use immutable exclusive-created events and a monotonic invalidation-wins fold; do not support mutable in-place edits.
- [Another process invalidates an already selected card] → Re-fold selected refs immediately before system or compaction injection; defer newly added cards until the next human prompt.
- [An unreadable or over-limit store suppresses useful cards] → Prefer visible fail-closed omission to a silent partial population; explicit tool diagnostics identify the safe recovery boundary.

## Proof And Runtime Boundary

- **Current Rung**: Planning only; no Product Candidate or runtime evidence exists.
- **Next Real Boundary**: After copied-plugin support checks, launch the pinned OpenCode executable with a materialized `session-env` config, disposable Git project, isolated OpenCode data directory, and deterministic loopback fake model provider; drive one root prompt and inspect the provider request for actual hook order and injected context plus the local persisted events.
- **Blocker/Unblocker**: Before implementation, recheck ownership of `session-env`, shared redaction, and test/runtime-profile files; serialize or wait on any active overlapping writer. No provider credential or external-network access is required.
- **Authorization**: Existing local-machine authority covers isolated local files and provider-free plugin execution. It does not authorize remote mutation, publication, or configured-provider use.
- **Safeguards**: Explicit startup feature env, temp data/config/project roots, deterministic loopback-only fake provider, no symlinks, external-egress canary, fixed filesystem capacity slots, bounded root lookup, root/subagent fixtures, and no write path outside the isolated store.
- **Restoration/Cleanup**: Stop the disposable process if used, remove only session-created temp roots, retain failing evidence before cleanup, and leave the repository and user data store untouched.
- **Evidence**: Exact invocation, candidate and environment identity, exit status, stdout/stderr, captured fake-provider request and response, observed hook order, rendered capsule, store tree and event hashes, warnings/truncation, external-egress canary, `git status --porcelain`, and temp artifact paths.

Supporting deterministic tests first exercise parser, fold, freshness, ranking, rendering, and hook composition. They support but do not replace the pinned-OpenCode loaded-entry-point boundary. The complete synthetic population and expected results are reviewed seed data outside helper code, with stable generation/readback and drift checks.

Because a defect can expose supported credential shapes, project paths, or another project's memory to a model request, a fresh test-only critical SDET challenge is required after accepted-scope runtime proof. It is limited to reachable privacy/isolation incidents and cannot edit production. After main dispositions and any required correction/re-proof, a separate fresh read-only evidence-sufficiency challenge must inspect the complete `PMC-001` population before the broad claim is represented as supported or narrowed.

## Migration Plan

1. Add the self-contained module and focused provider-free tests while the feature remains disabled by default.
2. Compose the module into `session-env`, run copied-plugin and runtime-surface validation, then execute the isolated pinned-OpenCode/fake-provider loaded-entry-point proof including actual hook order.
3. Document explicit enablement and the difference between local cards and curated Serena memories.
4. Roll back by setting `OPENCODE_PROJECT_MEMORY` to any value other than `1` and restarting OpenCode. Existing append-only local records remain inert and are not deleted automatically.

Schema version `1` has no predecessor and performs no migration. Unsupported future versions fail visibly and remain untouched.
