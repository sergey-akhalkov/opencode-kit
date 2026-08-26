## Why

Each new agent session can rediscover the same project-specific pitfalls, procedures, and conventions even though the kit already has curated Serena memories and session compaction. The kit needs one local, bounded recall path that preserves verified reusable knowledge without copying transcripts, depending on a hosted memory service, or flooding every prompt with cold context.

## Outcome Capsule

- **Outcome**: An explicitly enabled project can record verified tips, pitfalls, and successful procedures as local Markdown candidates, promote or invalidate them without destructive deletion, and inject only relevant current memories into a primary root session while keeping curated `.serena/memories/` read-only and available as the shared layer.
- **Operating Envelope**: One canonical local Git worktree root, with proof covering up to two local OpenCode processes sharing concurrent reads and append-only writes, at most 2,000 local cards and 10,000 total event files, 16 KiB per candidate event and 4 KiB per promotion/invalidation event, at most 100 curated Serena Markdown files totaling 512 KiB, and one complete advisory capsule of at most 8 KiB containing a maximum 2-KiB project core plus up to seven recalled items. The feature is read once at plugin startup and disabled unless explicitly enabled, stores local cards under an exact platform data root keyed by a privacy-safe project hash, and performs no provider, external-network, remote, or worktree mutation.
- **Non-Goals**: Hosted Mem0/Letta/Graphiti adoption, another MCP server, embeddings or vector storage, raw transcript capture, automatic promotion of inferred lessons, mandatory retrospectives or improvement tasks, direct mutation of `.serena/memories/`, cross-project recall, compatibility claims for arbitrary Markdown, or replacing OpenSpec, session delivery context, Codebase Memory, or Serena.
- **Non-Deferrable Invariants**: Current source, specs, runtime evidence, and user instructions outrank recalled memory; weak, candidate, invalidated, stale, malformed, over-budget, or fingerprint-mismatched cards are never injected automatically; only primary root sessions receive injected memory; cached selections are revalidated before every injection or compaction use; raw prompts and absolute project paths are not persisted in memory state or exposed in diagnostics; writes are append-only and fail visibly at fixed capacity; disabled or failed recall leaves normal OpenCode behavior unchanged.
- **Observable Proof**: Through the installed `session-env` entry point in a disposable project and isolated OpenCode data directory, explicitly enable memory, record and promote representative cards, observe a relevant primary-root prompt receive a bounded capsule, invalidate it from a second process before transform/compaction and observe omission, observe unrelated, stale, malformed, secret-bearing, and subagent cases receive no unsafe injection, verify compaction preserves only bounded selected memory context, and confirm retrieval performs no worktree or external-network mutation.
- **Material Residual Risks**: OpenCode hook payloads can change across supported versions; lexical matching can miss vocabulary shifts or rank an advisory card poorly; redaction patterns cannot prove absence of every unknown secret shape; curated Serena content can itself be stale; a 2,000-card scan may need a later measured index optimization.
- **Stop Line**: Finish the explicit enablement, strict Markdown card/event schema, append-only candidate lifecycle, bounded lexical recall, root-only prompt and compaction injection, read-only Serena layer, redaction and freshness guards, two narrow tools, provider-free tests, and installed-entry-point proof. Do not add semantic search, hosted storage, transcript mining, cross-project sharing, automatic promotion, mandatory process work, or a second memory server.

## Claim And Evidence Scope

- **Claim ID**: `PMC-001`
- **Claim Class**: Bounded project-memory selection and context injection across the supported local card population.
- **Population**: Valid records in one enabled project store within the stated 2,000-card/10,000-event size limits plus up to 100 current `.serena/memories/*.md` files within 512 KiB.
- **Coverage Basis**: Deterministic synthetic corpora for relevant hit, weak miss, exact path/symbol trigger, candidate, promoted, invalidated, stale, changed fingerprint, malformed schema, project-root and secret redaction, card/file/count budget, root/subagent separation, cross-process selection revalidation, compaction continuity, disabled mode, concurrent append, and no-worktree/no-external-network effects, followed by one disposable installed-plugin happy path.
- **Production Path**: The configured `global/plugin/session-env.ts` plugin composing the self-contained project-memory module, its custom tools, prompt hooks, and compaction hook.
- **Comparison Paths**: Disabled plugin behavior, explicit recall-tool output, and direct inspection of the isolated local store and disposable project worktree.
- **Environment**: The repository-pinned OpenCode plugin API on local Windows and provider-free cross-platform Node fixtures, with an isolated OpenCode data directory and disposable Git repository.
- **Real Oracle**: Loaded OpenCode hook/tool output, injected system context, persisted Markdown events, process diagnostics, external-egress canary, and `git status --porcelain` for the disposable project.
- **Unresolved Observations**: Retrieval quality outside the bounded corpus, unknown secret formats, very large future stores, vocabulary-only semantic matches, and behavior on unpinned OpenCode versions.
- **Maximum Claim**: The bounded supported schema and environment above; no general semantic-memory, secret-detection completeness, arbitrary-corpus quality, cross-version compatibility, or cross-project equivalence claim.

## Automation Dividend

- **Automation Dividend**: required - one provider-free corpus runner shall materialize reviewed memory cards and lifecycle events, drive recall/injection cases through the same module used by the plugin, and verify stable output, privacy, bounds, and side effects.

## What Changes

- Extend the existing `session-env` composition owner with two narrow project-memory tools and root-only prompt/compaction hooks.
- Add a self-contained project-memory module that resolves a privacy-safe per-project data directory, parses strict Markdown records, applies an append-only candidate/promote/invalidate lifecycle, and never stores raw session transcripts.
- Rank current active cards with deterministic lexical scoring, metadata/path/symbol filters, confidence and freshness signals, then inject zero to seven cards without padding weak matches.
- Read `.serena/memories/` directly as an optional bounded curated layer without requiring the Serena MCP runtime or writing shared memories.
- Reuse the existing plugin redaction layer and add deterministic malformed, stale, fingerprint, privacy, concurrency, budget, root/subagent, compaction, and no-side-effect validation.

## Capabilities

### New Capabilities

- `project-memory-context`: Defines local append-only memory records, explicit lifecycle management, bounded lexical recall, optional curated Serena context, root-only injection, privacy guards, and failure behavior.

### Modified Capabilities

None.

## Impact

- `global/plugin/session-env.ts` remains the loaded plugin and composition owner; implementation adds a self-contained module under `global/plugin/project-memory/` and reuses `global/plugin/session-delivery-context/redaction.ts`.
- Focused tests and proof inventory cover the module and the copied/installed plugin boundary. No new runtime dependency, MCP server, external service, provider call, config schema, or shared/product-owned persisted format is introduced; the capability does introduce the versioned machine-local Markdown event schema defined here.
- The local card store is machine-local under the OpenCode data directory. Existing Git-tracked `.serena/memories/` files remain unchanged and manually curated.
- Implementation must recheck active-change ownership before touching `session-env`, shared redaction, plugin tests, runtime-profile validation, or installer surfaces; planning artifacts do not transfer those owners.
