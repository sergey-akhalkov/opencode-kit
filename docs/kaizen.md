# Cross-Project Kaizen Inbox

The Kaizen inbox is a machine-local, append-only store for explicit workflow-improvement signals from multiple projects. It preserves bounded evidence and lifecycle state without turning feedback into product scope, automatically changing source, or blocking the task that exposed the friction.

## Activation And Rollback

Kaizen is enabled by default when a maintained `core` or `all` profile loads `plugin/session-env.ts` for a valid canonical Git worktree. The loaded plugin exposes the Kaizen tools and hooks; it does not prove that every optional capture lane has supplied a valid signal.

Set this startup environment value to disable Kaizen completely:

```text
OPENCODE_KAIZEN=0
```

Quit and restart OpenCode after changing the value. OpenCode and the plugin read the environment at startup. A running session that still advertises `kaizen_report` remains enabled even if the parent environment changed later.

Disabled mode registers no Kaizen tools or hooks and writes no Kaizen state. It leaves Graphify, session-delivery context, project memory, ordinary compaction, archive authority, and Markdown fallback behavior under their existing owners.

Rollback is inert rather than destructive:

1. Set `OPENCODE_KAIZEN=0` in the environment used to start OpenCode.
2. Quit and restart OpenCode.
3. Confirm the Kaizen tools are absent. Do not infer disabled state from an environment edit while an old process remains open.
4. Leave existing records in place unless deliberate manual cleanup is separately required.

Disabling Kaizen does not rewrite repository files, delete records, restore `OPENCODE_CONFIG_DIR`, or roll back unrelated plugin behavior.

## Operator Commands

Use the global commands rather than constructing raw lifecycle calls for normal inspection and triage:

- `/kaizen-status` reads at most 25 signals without signal payload details. Optional arguments are status-filter intent, not shell flags.
- `/kaizen-triage` imports eligible fallback entries, reads at most 25 pending signals, appends one evidence-bounded decision per processed signal, and may create at most one ordinary proposal only at the configured owner root.

`/kaizen-status` reports these versioned sections exactly from `kaizen_status`: activation, privacy-safe project ref, stable ordering, proposal-owner state, selection, lifecycle counts, capacity, signals, decisions, checkpoints, diagnostics, observations, derived repair gaps, and truncation. With `details: false`, signals contain refs and lifecycle metadata but not summary, evidence, impact, likely cause, or do-not-repeat text.

The loaded plugin owns five tools:

- `kaizen_report`: append one explicit closed-schema signal. Successful persistence returns a privacy-safe signal ref and deduplicates matching kind plus normalized summary.
- `kaizen_status`: read bounded status. Tool calls accept limits `1..25`; cross-project payload details require proposal-owner state `current-root`.
- `kaizen_decision`: append one non-authorizing decision for an existing signal. Unknown ownership permits only `needs-investigation`.
- `kaizen_checkpoint`: open or close one idempotent archive-harvest checkpoint. It never performs archive movement.
- `kaizen_import_feedback`: import one exact maintained `FB-*` Markdown fallback entry. Written legacy status is evidence, not current disposition.

Tools require the current session/message and canonical project context. Tool output is bounded: report, decision, checkpoint, and import output are at most 4 KiB; status output is at most 32 KiB.

## Signal And Lifecycle States

New signals begin `pending`. Explicit decisions and transitions can leave the folded signal in `triaged`, `promoted`, `resolved`, or `wont-fix`. Counts, recurrence, `scopeHint`, and cross-project presence are navigation facts only; they do not establish ownership, severity, semantic cohesion, or authorization to propose or implement work.

Signals can come from four source classes:

- `explicit`: `kaizen_report`, normally routed through `complain`.
- `compaction`: one valid post-compaction envelope.
- `archive`: one valid archive-harvest closure containing one to three signals.
- `legacy-feedback`: idempotent import of one maintained `FB-*` fallback entry.

### Compaction

The Kaizen plugin appends an output contract to OpenCode's compaction context without replacing the configured compaction prompt. `session-env` composes any selected project-memory capsule first and the Kaizen contract second. The capture hook accepts exactly one unfenced envelope with schema version 1 and zero to three signals. An empty valid envelope records a durable `no-signal` observation. Missing, duplicate, malformed, wrong-root, timeout, lookup, and store failures produce bounded diagnostics and one privacy-safe warning chain while ordinary compaction remains usable.

Automatic compaction capture depends on the loaded plugin context reaching the compaction model, that model emitting the exact envelope, and unambiguous root-session summary correlation. The context hook never assigns `output.prompt`, so active/template prompt drift remains a separate compaction-continuity diagnostic rather than a Kaizen activation requirement. Inspect that separate relation with:

```sh
npm run opencode:sources
```

The diagnostic reports only hashes, semantic markers, status `same | different | missing | unknown`, and the synchronization/restart boundary. It never prints prompt text or changes the active copy. Treat `different`, `missing`, or `unknown` as an unproved managed-prompt continuity lane, not as permission to scan transcripts or persist arbitrary summaries. Kaizen still requires its own copied-plugin or installed compaction observation.

### Archive Harvest

The persisted checkpoint states are:

- `harvest-pending`: one checkpoint opened before the canonical archive helper.
- `captured`: successful archive plus one to three persisted archive signals.
- `no-signal`: successful archive plus a valid empty reflection.
- `archive-failed`: the canonical helper failed and the open checkpoint closed with no signal.

`repair-gap` and `unavailable` are report states, not persisted checkpoint statuses:

- `repair-gap` is derived when the change is already archived but its successful-archive checkpoint remains `harvest-pending`. Repair closes only that exact checkpoint as `captured` or `no-signal`; it never repeats archive movement.
- `unavailable` means no durable checkpoint state was established because the tool was absent, disabled, unsupported, or failed. Archive processing continues under the archive helper's independent result.

The deterministic `global/bin/openspec-archive.ts` helper remains the only archive movement authority. Kaizen state cannot make an incomplete archive successful, waive validation, reopen an archive, or authorize commit, push, release, or deployment.

## Complain, Fallback, And Import

The `complain` skill routes a current-session issue to `kaizen_report` when that tool is advertised. A successful inbox call is authoritative and must not also write `docs/feedbacks/**`.

Markdown under `docs/feedbacks/**` is degraded transport only when the tool is absent or definitively unavailable before persistence. If a call may have persisted before failing, the result is `capture-unknown`; do not create a fallback duplicate. `/kaizen-triage` can import at most 25 stable-ordered maintained `FB-*` entries without rewriting or deleting the files. Repeated import is idempotent, and stale Markdown status never resolves a current inbox signal.

## Proposal Owner Containment

Proposal promotion is off unless OpenCode starts with an absolute existing canonical directory in:

```text
OPENCODE_KAIZEN_PROPOSAL_OWNER_ROOT=<absolute-opencode-kit-root>
```

Status reports one state:

- `unconfigured`: no owner root was supplied.
- `invalid`: the value is not an exact absolute existing directory.
- `different-root`: the active project is not the configured owner root.
- `current-root`: the active project is exactly the configured owner root.

Only `current-root` may request cross-project signal details or create a proposal. Consumer projects can append evidence-bounded `kit-candidate` or `needs-investigation` decisions but cannot mutate the configured kit root. Even at `current-root`, `/kaizen-triage` may create at most one ordinary OpenSpec proposal after current reviewed evidence establishes one cohesive kit-owned improvement. It never auto-applies, archives, commits, pushes, opens a remote issue, or changes a source project.

## Storage, Bounds, And Privacy

The store is shared across canonical projects and uses privacy-safe project/session refs. It does not persist an absolute-project reverse map.

```text
<opencode-data>/kaizen/v1/inbox/
  signals/signal-0000.json ... signal-1999.json
  events/event-000000.json ... event-007999.json
```

The base `<opencode-data>` uses this precedence:

- Explicit `OPENCODE_DATA_DIR`; a relative value resolves from the plugin startup directory.
- Windows: `%LOCALAPPDATA%\opencode`, then `%APPDATA%\opencode`.
- macOS: `~/Library/Application Support/opencode`.
- Other platforms: `$XDG_DATA_HOME/opencode`, then `~/.local/share/opencode`.

The fixed store bounds are 2,000 signal records at most 16 KiB each and 8,000 lifecycle records at most 4 KiB each. Writes claim exclusive fixed slots, never overwrite records, and fail visibly when storage is malformed, unreadable, partial, or full. Status orders selected signals by oldest `createdAt`, then signal ref, and reports exact usage plus per-list truncation.

Signal text uses a closed schema: kind, summary, observed evidence, impact, likely cause, do-not-repeat guidance, scope hint, and one to eight repository-relative evidence refs. Before persistence, known project-root variants, credential shapes, home paths, and session identifiers are redacted or rejected. Diagnostics and ordinary status are payload-free.

This is a privacy ceiling, not a guarantee that every unknown secret format can be detected. Never submit credentials, tokens, raw private prompts, transcripts, arbitrary tool output, unnecessary personal data, or absolute private paths. Kaizen performs no configured-provider or external-network request by itself.

## Inspect And Clean Up

Use `/kaizen-status` before filesystem inspection to capture activation, project ref, capacity, counts, and truncation without payload details. Records are ordinary JSON under the exact data root above. Stop OpenCode before manual inspection so no process can append while the store is being reviewed. Do not edit individual slot files: signals and lifecycle records are append-only and cross-reference one another.

There is no destructive Kaizen cleanup tool. To remove the entire local Kaizen history deliberately:

1. Set `OPENCODE_KAIZEN=0`, quit OpenCode, and verify no OpenCode process using that data root remains.
2. Resolve the active `<opencode-data>` using the precedence above and verify the exact target is `<opencode-data>/kaizen/v1`.
3. Back up that exact directory if recovery matters.
4. Remove only `<opencode-data>/kaizen/v1` with normal operating-system file tools.
5. Do not remove sibling `project-memory`, OpenCode databases, config, provider state, or another user's data root.
6. Restart OpenCode with Kaizen disabled. Re-enable and restart only when a new empty history is intended.

Removing a subset of slot files is unsupported because it can break deduplication and lifecycle references. Manual cleanup is destructive local maintenance and is never part of install, rollback, archive, or normal triage.

## Maintainer Proof

Inspect the maintained proof contract before a run:

```sh
node tools/proofs/cross-project-kaizen.ts --help
```

Provider-free focused checks are:

```sh
node tools/test-cross-project-kaizen.ts
node tools/test-session-env-plugin.ts
node tools/proofs/cross-project-kaizen.ts --mode population
```

Loaded modes require the absolute pinned OpenCode executable. The runner creates and removes its own temporary output:

```sh
node tools/proofs/cross-project-kaizen.ts --mode capture-compaction-identity --opencode <absolute-path>
node tools/proofs/cross-project-kaizen.ts --mode loaded-tools-preflight --opencode <absolute-path>
node tools/proofs/cross-project-kaizen.ts --mode loaded-tools --opencode <absolute-path>
```

The provider-free population proves only its reviewed fixture paths. Component loaded modes prove only their exercised source, environment, tool, and cleanup identities. None alone establishes complete installed command following, all compaction/archive behavior, every secret format, proposal quality, SDET closure, or the complete `KZN-001` claim.
