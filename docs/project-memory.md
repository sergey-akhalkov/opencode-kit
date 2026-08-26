# Project Memory

Project memory is an optional local advisory layer for reusable project tips, pitfalls, and procedures. It stores explicit append-only Markdown events outside the project worktree and injects only relevant current memory into verified primary root sessions.

Current user instructions, source, specifications, and runtime evidence always outrank recalled memory.

## Enable Or Disable

Project memory is disabled unless the plugin process starts with exactly:

```text
OPENCODE_PROJECT_MEMORY=1
```

The plugin reads this value once at startup. Quit and restart OpenCode after enabling or disabling it. Changing the variable in a running process does not change the loaded feature.

To roll back, set `OPENCODE_PROJECT_MEMORY` to any value other than `1`, or remove it, then restart OpenCode. Existing local records remain inert and are not deleted automatically.

`OPENCODE_DATA_DIR` optionally selects the OpenCode data base directory. A relative value is resolved from the plugin startup directory.

## Tools

When enabled for a valid canonical project root, the plugin exposes exactly two tools.

### `project_memory_manage`

Create a candidate:

```json
{
  "action": "candidate",
  "title": "Restart the shared supervisor",
  "kind": "procedure",
  "confidence": "high",
  "triggers": ["restart supervisor"],
  "appliesTo": {
    "paths": ["src/config.ts"],
    "symbols": ["restartDeadline"]
  },
  "evidencePaths": ["src/config.ts"],
  "technique": "Use the validated restart path.",
  "why": "It preserves process ownership.",
  "evidence": "Observed in the focused runtime proof.",
  "invalidatedWhen": "The ownership contract changes."
}
```

`kind` is `tip`, `pitfall`, or `procedure`. `confidence` is `low`, `medium`, or `high`. Paths must be repository-relative and cannot contain parent traversal. `appliesTo` and `evidencePaths` are optional; all other fields shown above are required.

Promote a reviewed candidate:

```json
{
  "action": "promote",
  "cardRef": "card_<privacy-safe-ref>",
  "evidence": "Verified against current source and runtime behavior.",
  "verifiedAt": "2026-08-25T18:00:00.000Z"
}
```

`verifiedAt` is optional and defaults to the current time. Promotion appends an immutable event and snapshots fingerprints for declared evidence paths. It never rewrites the candidate.

Invalidate a card:

```json
{
  "action": "invalidate",
  "cardRef": "card_<privacy-safe-ref>",
  "reason": "The owning behavior changed."
}
```

Invalidation is terminal. A later promotion cannot reactivate that card. Create and review a new candidate instead.

### `project_memory_recall`

```json
{
  "query": "How should I restart the supervisor?",
  "path": "src/config.ts",
  "symbol": "restartDeadline",
  "statuses": ["active"],
  "limit": 7
}
```

Only `query` is required. `path` must be repository-relative. `statuses` can contain `candidate`, `active`, and `invalidated`; explicit recall labels exclusion reasons. `limit` is from `1` through `7`. Output is versioned JSON capped at 16 KiB. Manage output is capped at 4 KiB and returns refs, status, and diagnostics rather than complete candidate content.

## Admission And Staleness

Automatic context uses active local cards and current eligible Serena memories only. It does not pad weak matches. Exact trigger, path, or symbol signals receive deterministic boosts; otherwise at least two distinct query terms and the configured lexical score are required.

Local cards are omitted from automatic context when any of these conditions applies:

- The record is still a candidate or is invalidated.
- Verification is more than 180 days old.
- A declared evidence path is missing.
- A current evidence fingerprint differs from the promoted fingerprint.
- The record is malformed, unsafe, or outside a declared size/count envelope.
- The selected card becomes invalid before system transformation or compaction.

New cards wait until the next human message. Cached selections are revalidated before every system or compaction use. Child sessions, failed/unknown root lookups, and reversed hook order receive no injected project memory. Compaction appends the bounded advisory capsule and does not replace OpenCode's prompt or create improvement work.

## Serena Memories

`.serena/memories/` is a separate, optional curated layer:

- Project memory reads current regular Markdown files directly and never requires a Serena MCP process.
- `core.md` can provide at most 2 KiB of project core context and is not ranked as a recalled item.
- Other Markdown files can rank with active local cards while retaining a `serena` source label.
- The reader accepts at most 100 files and 512 KiB total, rejects symbolic links and escapes, and never writes, promotes, invalidates, renames, or deletes Serena files.

Local candidate actions never publish into Serena. Shared curated-memory changes remain a separate human-reviewed workflow.

## Storage And Limits

The local store is:

```text
<opencode-data>/project-memory/v1/project_<32-hex-project-ref>/
  cards/card-0000.md ... card-1999.md
  events/event-000000.md ... event-007999.md
```

The base `<opencode-data>` uses this precedence:

- Explicit `OPENCODE_DATA_DIR`.
- Windows: `%LOCALAPPDATA%\opencode`, then `%APPDATA%\opencode`.
- macOS: `~/Library/Application Support/opencode`.
- Other platforms: `$XDG_DATA_HOME/opencode`, then `~/.local/share/opencode`.

Each canonical worktree has a distinct hashed store. The store never persists a reverse map to the absolute worktree path.

Limits are 2,000 candidate files, 8,000 lifecycle files, 16 KiB per candidate, and 4 KiB per promotion/invalidation. The total advisory capsule is at most 8 KiB, including warnings, up to 2 KiB of core context, and at most seven recalled items. Writes use exclusive fixed slots and fail visibly at capacity; records are never overwritten or deleted by the plugin.

## Privacy And Failure Behavior

Candidate text, curated snippets, tool output, capsules, and diagnostics replace canonical project-root variants before applying the existing credential, home-path, and session redaction. Persisted evidence paths stay repository-relative and promotion stores content digests, not absolute paths.

Supported redaction patterns reduce exposure but do not guarantee detection of unknown secret formats. Do not place credentials, raw transcripts, or sensitive payloads in candidates. The feature never infers candidates from prompts, transcripts, tools, or compaction and performs no provider or external-network request.

Malformed records are quarantined behind privacy-safe refs. Unreadable or over-limit local storage fails closed for local automatic recall while the curated source remains independent, and vice versa. Tool failures remain visible with bounded cause codes; automatic-hook failures emit one bounded warning per safe session/reason ref and preserve unrelated OpenCode behavior.

## Inspect Or Clean Up

Records are ordinary Markdown and can be inspected under the exact hashed project directory shown above. Stop OpenCode before manual maintenance so another process cannot append while files are being inspected.

There is no destructive cleanup tool. To remove local memory deliberately:

1. Disable project memory and quit OpenCode.
2. Resolve the active `<opencode-data>` using the precedence above.
3. Use the `projectRef` returned by either tool to identify and review the exact `project_<32-hex-project-ref>` directory for the intended worktree.
4. Back it up if recovery matters, then remove only that exact directory with normal operating-system file tools.
5. Restart OpenCode. Re-enable the feature only when a new empty local history is intended.

Do not delete `.serena/memories/` as part of local project-memory cleanup.

## Maintainer Proof

The provider-free maintained corpus is:

```powershell
npm run proof:project-memory -- --evidence-dir <new-repository-evidence-path>
```

Focused tests are:

```powershell
npm run test:focused:project-memory
```

The proof command requires a create-new repository-local evidence path, uses only disposable project/data roots, reports cleanup, and performs no configured-provider or remote call. Loaded OpenCode proof is a separate maintainer qualification mode described by:

```powershell
node tools/proofs/project-memory-context.ts --help
```
