## Context

The active runtime already prefers `remove -> narrow -> reuse -> local guard` before new mechanisms and rejects speculative abstractions. That policy is intentionally concise, but it leaves five gaps:

1. It does not define which code changes must perform discovery and which changes must stay ceremony-free.
2. It does not provide a source of truth for capabilities in explicitly trusted peer projects.
3. It does not preserve a reusable capability when the central catalog is unavailable.
4. It does not distinguish "ready-made code exists" from "ready-made code has lower total lifecycle cost and satisfies the current contract."
5. It does not bootstrap or incrementally refresh useful structure/architecture knowledge from explicitly selected projects, so a curated catalog starts empty and repeated rescans waste time.

The existing `tools/project-inventory.ts` maps source roots, package scripts, config, and large files; it is not a capability catalog. Codebase Memory can search one selected indexed project and resolve source symbols, but `list_projects` is a flat machine-local inventory with no groups, tags, trust metadata, capability records, or freshness field. It therefore cannot own the allowlist or registry. It remains useful after a logical registry entry selects an explicitly bound project.

The user selected these policy decisions during exploration:

- Discovery is mandatory only for new mechanisms, not every code edit.
- Peer projects are selected through an explicit allowlist.
- Registration is capability-level, not file-level.
- External libraries are selected by total lifecycle cost, not an absolute ready-made-code priority.
- The catalog lives in a separate private/local registry repository with named groups.
- A short disposition records triggered discovery.
- Public ecosystem search is mandatory for typical capabilities when local and registered candidates do not fit.
- An unavailable registry produces durable pending outbox state and explicit degraded evidence rather than blocking code completion.
- Inventory is initiated through a reusable OpenCode command with a short free-form prompt rather than user-facing CLI flags.
- The command resolves an existing local registry checkout; it asks for a local path when only a Git URL is supplied and SHALL NOT clone, fetch, pull, commit, or push.
- Automatic inventory covers structure plus architecture evidence and records code entrypoints, while trusted capability promotion remains curated.
- Each target project remembers the exact last successfully scanned commit and uses incremental aggregate Git changes for later refresh.

This is a Material instruction-policy change. The implementation must prove both product behavior and the absence of a new routine context tax. The repo-local OpenSpec boundary permits portable kit artifacts and disposable registry fixtures only. The shipped command supports later owner invocation, but implementation proof SHALL NOT scan or populate the owner's real registry/projects.

## Goals / Non-Goals

**Goals:**

- Trigger bounded discovery before code only when a change creates a new dependency, mechanism, common infrastructure capability, reusable API, abstraction/plugin point, or another implementation of repeated behavior.
- Search in a stable order and stop as soon as a verified candidate satisfies the current contract with lower total cost.
- Keep the current repository and installed dependencies as the cheapest discovery layers.
- Make trusted cross-project discovery private, allowlisted, registry-led, and query-on-demand.
- Reuse Codebase Memory only to verify selected bound source, never to enumerate all indexed projects as a trust source.
- Keep new custom code concrete and minimally sufficient until current consumers or independent ownership justify a capability boundary.
- Register qualifying owned capabilities and adopted external libraries without blocking offline work or performing remote Git operations.
- Bootstrap a useful generated inventory and capability-candidate layer from an explicit project set before the curated catalog has entries.
- Refresh generated knowledge from the last successful committed-tree checkpoint instead of rescanning unchanged projects.
- Let the user describe registry, projects, group, and intent in plain text while keeping exact deterministic plans and machine inputs underneath.
- Preserve a compact always-loaded trigger and lazy-load detailed workflow guidance only for triggered work.
- Produce deterministic schema, privacy, stale-record, outbox, and bounded-output evidence plus same-model behavioral evidence for quality, speed, and token economy.

**Non-Goals:**

- Building an organization package manager, source-code warehouse, semantic search service, dependency installer, vulnerability service, or license oracle.
- Automatically deciding candidate fit, assigning a fuzzy quality score, or executing commands supplied by registry data.
- Registering private helpers, one-off glue, generated/vendor code, every file, rejected ecosystem candidates, or hypothetical extension points.
- Querying every Codebase Memory project; cloning, fetching, pulling, committing, or pushing repositories; creating a remote registry; or scanning a dirty/untracked working tree.
- Guaranteeing that an incomplete registry prevents every duplicate implementation.
- Replacing source inspection, tests, real-boundary proof, package-manager policy, security review, or owner authority.
- Automatically declaring discovered candidates reusable, inferring a full business-domain ontology, retaining commit-by-commit historical semantics, or solving team-wide registry governance/access control/replication in this increment.

## Decisions

### D1. Use a precise new-mechanism trigger instead of universal pre-code search

Discovery is mandatory when the proposed change introduces at least one of:

- a new package dependency;
- a new top-level module, service, executable tool, or reusable API;
- a parser, serializer, validator, adapter, client/protocol, cache, queue, retry, scheduler, simulator, or proof harness not already owned by the touched subsystem;
- an interface, factory, plugin point, generic framework, or other abstraction intended for multiple implementations;
- another implementation of behavior already observed in more than one location.

Owner-local bug fixes, data/config edits, generated output, mechanical changes, and glue under an already selected API do not trigger the workflow unless they independently introduce one of the items above. The disposition records why an ambiguous change did or did not trigger discovery.

**Why**: Searching all sources before every edit would consume the tokens and time this change is intended to save.

**Alternative rejected**: Universal search for every function maximizes nominal coverage but adds routine tool calls and encourages treating small helpers as libraries.

### D2. Search from cheapest evidence to broadest evidence, with an explicit stop condition

Triggered work uses this order:

1. Remove or narrow the requested mechanism if the accepted outcome does not need it.
2. Search the current repository's symbols, modules, tests/helpers, and documented tools.
3. Check platform/standard-library capabilities and already installed dependencies.
4. Query enabled named groups in the validated central registry.
5. Open and verify only promising bound source projects and evidence.
6. For a typical ecosystem capability that still has no fit, perform read-only public library research.
7. Build the smallest concrete custom owner only when no candidate satisfies the current contract at lower total lifecycle cost.

Discovery stops when a verified candidate satisfies the current contract and continuing to broader sources cannot materially change the accepted selection. It also stops when the next source is unavailable or its expected decision value is lower than the bounded search cost; that stop is explicit in the disposition.

**Why**: Current-project reuse is cheaper and safer than cross-project or ecosystem adoption. A fixed order prevents repeated broad scans.

**Alternative rejected**: Searching the external ecosystem first can miss already adopted project conventions and increase dependency risk.

### D3. Record one compact architectural disposition, not a full search transcript

Triggered work records:

- requested capability and trigger;
- search layers reached and any blocked layer;
- candidates materially considered;
- `reuse | extend | build-minimal`;
- contract-fit and total-cost reason;
- registry impact: `synced | pending | not-applicable`.

OpenSpec design/evidence owns the disposition for spec-driven changes. Ordinary Small work may keep it only in the final handoff. Query command output remains raw evidence when useful but is not copied wholesale into planning artifacts.

**Why**: The disposition is auditable without turning every query into durable prompt or documentation debt.

**Alternative rejected**: No durable trace makes the requirement unverifiable. A complete search log creates a large privacy and token burden.

### D4. Use a separate private registry repository as catalog source of truth

The kit ships a project-neutral template and schema. A real registry is instantiated later at an explicit local root. Its logical structure is:

```text
<registry-root>/
  registry.json
  projects.json
  groups.json
  capabilities/
    <project-id>.json
    external.json
  schemas/
  generated/
    projects/
      <project-id>.json
    capability-index.json
```

`projects.json` owns stable logical IDs and non-machine-specific source identity. `groups.json` maps named groups to project IDs. `generated/projects/<project-id>.json` atomically co-locates the last successful scan checkpoint, deterministic structure/architecture inventory, and untrusted discovery candidates for one target project. One curated capability file per project limits merge contention and targeted-read cost. `external.json` records only libraries actually adopted for a capability. The generated capability index is rebuildable and never becomes an independent source of truth.

The kit repository contains no owner's project list, private capability names, absolute roots, or actual registry checkout.

**Why**: Keeping organizational catalog data out of a portable public kit preserves privacy and project neutrality.

**Alternatives rejected**:

- Putting the catalog in `opencode-kit` mixes portable workflow code with private project inventory.
- Per-project manifests distribute ownership well but do not provide the central private catalog selected by the user.
- Treating Codebase Memory as the registry invents trust/group metadata absent from its project records.

### D5. Keep machine identity in one explicit private binding

The portable core accepts an explicit config path. A thin kit adapter may resolve `OPENCODE_REUSE_CONFIG`; no other implicit config source is guessed. The private config contains:

```json
{
  "version": 1,
  "registryRoot": "<absolute-local-path>",
  "cacheRoot": "<absolute-local-path>",
  "outboxRoot": "<absolute-local-path>",
  "enabledGroups": ["personal"],
  "projects": {
    "shared/dev-tooling": {
      "root": "<absolute-local-path>",
      "scanRef": "refs/heads/main",
      "codebaseMemoryProject": "<exact-index-name>"
    }
  }
}
```

The deterministic core never guesses this file, logs roots by default, or derives a project from basename similarity. The natural-language command may create or update a private binding only from an exact resolved user request and a successful preview; it SHALL ask one precise question when registry/project/ref resolution is ambiguous. Blank, missing, unreadable, malformed, or ambiguous config produces structured degraded diagnostics.

**Why**: Logical identities are portable; Codebase Memory names and roots are machine-specific. One explicit source avoids precedence ambiguity and accidental inventory disclosure.

**Alternative rejected**: Storing roots in the central registry makes the catalog non-portable and leaks private machine layout.

### D6. Keep capability records concise, strict, and navigational

A capability record contains only fields needed to find and assess source:

```json
{
  "id": "text/jsonc-parse",
  "project": "shared/dev-tooling",
  "kind": "library",
  "summary": "Parse JSONC with source-position diagnostics",
  "keywords": ["comments", "jsonc", "parser", "trailing-comma"],
  "entrypoints": [{ "path": "src/jsonc.ts", "symbol": "parseJsonc" }],
  "effects": ["none"],
  "constraints": ["node>=20"],
  "maturity": "portable-proven",
  "evidence": [{ "path": "tools/proofs/jsonc-portability.md" }],
  "status": "active"
}
```

Normative schema rules include:

- stable unique IDs and project references;
- relative normalized paths with no traversal;
- bounded string/list lengths and unique sorted keywords;
- enumerated kind, maturity, status, and effect classes;
- exactly one of `symbol` or `command` when an entrypoint requires it;
- evidence paths that are navigational and never auto-executed;
- deprecation replacement only when the target capability exists;
- external records with ecosystem, package identity, accepted version range, constraints, and evidence but no copied package documentation.

Maturity values are `local-reusable`, `portable-proven`, and `adopted-external`. A custom capability qualifies for registration only when it has a stable shared/public or standalone tool boundary, two current consumers, or representative unrelated-project proof. Only `portable-proven` claims cross-project portability.

**Why**: Registry metadata should answer "where should I inspect?" rather than duplicate source or make compatibility claims.

**Alternative rejected**: Rich manually maintained API documentation, consumer lists, timestamps, and quality scores drift rapidly and enlarge every query.

### D7. Deterministic query filters exact normalized terms and returns bounded schema-only data

The portable client exposes these logical operations:

```text
status
bootstrap <resolved-plan>
rescan <resolved-plan>
query --need <term>... --groups <id>... --limit <n>
validate
enqueue --candidate <path>
sync
```

The core receives an explicit machine-readable plan/config even when the user-facing command used free text; it has no kit checkout, package-manager, shell, or service assumptions. Query behavior:

- validates registry/config/cache identity before use;
- intersects requested groups with machine-enabled groups;
- tokenizes normalized IDs, summaries, and keywords without fuzzy or semantic scoring;
- requires all requested terms to match the normalized searchable fields;
- sorts by capability ID for stable output;
- defaults to 10 records, caps the accepted limit, and reports total/`hasMore` so callers narrow rather than silently truncate;
- returns logical project ID, capability fields, binding status, registry revision/hash, and verification hints only;
- never returns unrelated projects or absolute roots unless an explicit diagnostic mode is requested.

After query, the agent opens a selected bound source path or uses the exact bound Codebase Memory project to locate the named symbol. It does not call `list_projects` to discover peers and does not query unselected projects.

**Why**: Deterministic exact filtering is cheap, explainable, and allowed by the kit's helper-automation contract. Fit remains agent judgment.

**Alternatives rejected**:

- Fuzzy ranking or model summaries in the helper violate deterministic-helper boundaries.
- Returning the whole group transfers registry size directly into model context.

### D8. Treat registry, cache, and source as untrusted and independently verifiable

The client validates JSON schema, path containment, duplicate IDs, group/project references, index derivation, and replacement references. Text fields are emitted only as data. The client never executes a command, follows a path outside its bound root, loads code from a registry field, installs a package, or invokes Git remote operations.

A successful query is discovery evidence, not compatibility proof. Before selection, the agent verifies current entrypoint existence, actual contract/effects/constraints, and relevant evidence. Missing source, missing symbol, mismatched project binding, or contradictory evidence marks the candidate stale or incompatible. It cannot produce a reuse claim.

**Why**: Even a private registry can contain stale, malformed, or instruction-like text.

### D9. Use a validated private cache and explicit degraded mode

A successful registry validation may materialize a private cache containing only the validated bounded search index, registry identity, source hash/revision, and generated-at fact. The cache is accepted only when its schema and registry identity match the active private config. Age is reported, not interpreted by a hard time threshold.

If the registry root is unavailable, the client may query the last validated matching cache and reports `source: cache`. If neither registry nor cache is usable, status/query returns `degraded` with the exact unavailable layer. Triggered work then searches current code, installed/platform capabilities, and the public ecosystem when applicable; records the blocked cross-project layer; builds only a minimal concrete owner; and does not call it reusable or portable until later registry verification.

**Why**: This preserves offline speed without silently claiming complete cross-project discovery.

**Alternative rejected**: Blocking all implementation on catalog availability makes a local advisory knowledge system a single point of failure.

### D10. Use a durable private outbox for unavailable registration

Qualifying capability registration has three statuses:

- `synced`: the validated central catalog contains the record;
- `pending`: a schema-valid candidate exists in the configured private outbox but is not discoverable;
- `not-applicable`: the new code does not meet capability-level qualification, with a brief reason.

`enqueue` writes an atomic candidate to the configured outbox and refuses path escape, secret-bearing fields, duplicate pending identity, or malformed source references. `sync` validates the active registry and pending record, refuses conflicting overwrite, updates only the configured local registry root, regenerates/validates the index, and marks the outbox item synced only after the catalog is readable and consistent. It never commits, pushes, publishes, or deletes an unresolved/conflicting pending record.

Status reports pending count and stable IDs. Handoffs report pending records. The next triggered discovery begins with status so pending work remains visible. Pending state does not block completion of otherwise valid product code, but it cannot be represented as registry discovery coverage.

**Why**: Direct mandatory writes to a second Git repository would add cross-repo liveness, validation, and remote-state coupling to every product task.

**Alternative rejected**: Warning-only registration is easy to forget; completion-blocking central sync harms offline and local work.

### D11. Separate external research from adopted-library catalog records

For a typical capability with no local or registered fit, the agent performs a bounded read-only ecosystem search using current official package metadata/source and project-native policy. Selection considers:

- exact contract and error/effect fit;
- adaptation/glue cost;
- runtime/platform cost;
- provenance, maintenance, license, and known vulnerability evidence;
- API stability and upgrade burden;
- proof cost and project ownership;
- resulting code/context reduction.

Rejected search results are not registered. An adopted dependency may receive one external capability record after the project has accepted and proved it. The registry record is a navigation/decision aid and does not authorize dependency mutation in another project.

**Why**: Mirroring public package catalogs would be stale, expensive, and unrelated to the trusted reuse decisions the registry is meant to preserve.

### D12. Keep runtime authority compact and details lazy-loaded

`global/AGENTS.md` remains the canonical concise trigger and authority. It replaces, rather than duplicates, the existing reuse sentence with the trigger, required disposition, minimal-abstraction rule, and instruction to load the reuse-discovery skill only when triggered. Detailed search order, registry protocol, total-cost matrix, and outbox behavior live in one reusable skill. Project templates and role artifacts use pointers or role-specific deltas.

No new agent is introduced. The deterministic registry client and schemas are code/data, not prompt context. Instruction inventory must show no increase in always-loaded global authority or the maintained shared runtime corpus; any lazy skill cost is paid for by consolidating superseded reuse/modularity wording rather than copying it across artifacts.

**Why**: Always loading the catalog or full workflow would defeat the token-economy goal.

### D13. Prove product behavior at two real boundaries before qualification

Evidence topology:

- **Product Candidate**: natural-language command, registry schemas/template, bootstrap/rescan/query client, committed-tree checkpoint protocol, private config contract, loaded trigger, lazy skill, maintained mirrors, and completion/status integration.
- **Proof Runner**: a repository-native runner under the existing proof tooling convention that creates disposable registry, producer, and consumer Git repositories and invokes the real client/loader path.
- **Evaluator**: deterministic schema/privacy/output assertions plus an offline evaluator for captured same-model sessions.
- **Environment Identity**: candidate Git identity, Node/OpenSpec/OpenCode versions, selected model/profile, disposable roots, and Codebase Memory project identities when used.
- **Raw Evidence Bundle**: exact invocations, synthetic inputs, candidate/baseline instructions, exit status, stdout/stderr, file effects, model tool calls/token facts, registry/outbox bytes or hashes, cleanup result, and artifact paths.

Fidelity ladder used by all behavior slices:

1. Deterministic schema and fixture replay.
2. Local disposable Git registry/producer/consumer integration through the real client.
3. Same-model fresh-session baseline/candidate workflows through the real OpenCode loader and bounded local tools.
4. Owner's actual private registry and real project group activation, separately authorized and outside this change.

The same-model matrix includes free-form bootstrap, incremental refresh, local existing capability, allowlisted registered capability, stale record, typical external capability, no-match custom owner, trivial owner-local fix, unavailable registry/cache, and pending outbox sync. The candidate must preserve outcome/proof quality, resolve only named/configured projects, avoid unallowlisted access, avoid duplicate mechanisms in seeded reuse cases, avoid speculative APIs in the no-match case, and add no registry/skill call to the trivial fix. Raw token/tool-call and elapsed-time facts are reported; no deterministic helper invents a quality score.

**Why**: Static marker checks cannot prove that a model searches before coding or avoids ceremony when the trigger is absent.

### D14. Expose inventory as a reusable natural-language OpenCode command

The kit ships a reusable global command at the supported command-file boundary, provisionally `/reuse-inventory`. The command body accepts all text after the command as one free-form request rather than exposing positional or flag syntax. Examples include:

```text
/reuse-inventory Проинвентаризируй проекты Alpha и Beta в personal registry.
/reuse-inventory Обнови knowledge base для всех проектов группы personal.
```

The command orchestration SHALL:

1. Read only the named projects/group and the private reuse config.
2. Resolve the exact existing local registry checkout, project roots, logical IDs, and scan refs.
3. If the user supplied only a Git URL and no local checkout is bound, ask for one local path; do not clone.
4. If multiple roots/registries/refs match, ask one precise resolution question; do not enumerate unrelated projects.
5. Produce a concise machine-readable plan and human preview containing logical IDs, selected refs/commits, planned mode (`initial | incremental | no-op | full-fallback`), and intended local write roots.
6. Continue autonomously when the plan is exact and safe; no routine second approval is required.
7. Invoke the deterministic core with the resolved plan and return counts, checkpoint changes, generated candidate changes, stale curated impacts, diagnostics, and artifact paths.

The command is agentic orchestration: it may interpret natural language and make source-grounded project/candidate judgments. The core remains deterministic and accepts no ambiguous natural-language input.

**Why**: A single simple prompt provides the desired UX while preserving exact, testable, privacy-safe execution underneath.

**Alternatives rejected**:

- Requiring users to compose `--registry-root`, repeated `--project`, group, ref, and write flags makes the common operation hard to remember.
- Letting the deterministic scanner infer arbitrary roots from all Codebase Memory projects broadens trust and leaks inventory.
- Automatically cloning a supplied URL adds network, credentials, checkout destination, and Git lifecycle to a local inventory command.

### D15. Bootstrap a generated structure-and-architecture knowledge layer before curation

An initial bootstrap scans each exact committed target tree and writes one generated project record containing:

- logical project identity, repository identity, selected scan ref, exact commit/tree identity, scanner/schema/policy identity, and scan outcome;
- language/build/workspace/package roots and package manifests;
- public exports/entrypoints, executable commands, standalone tools/runners, and explicit service/route declarations where supported by deterministic source evidence;
- declared dependencies and existing adopted package facts;
- docs, specs, tests, proof runners/evidence, and code entrypoints as relative path plus symbol or command;
- optional Codebase Memory-enriched symbol/relationship hints only for the exact selected project and only when index identity/current-source compatibility can be established;
- generated capability candidates with `discovered | changed | stale | unchanged` state and evidence links.

Generated candidates are untrusted navigation aids. The scanner SHALL NOT assign `local-reusable`, `portable-proven`, or `adopted-external`, invent domain semantics, merge similar candidates across projects, or write curated capability records. The agent inspects source and evidence, then uses existing enqueue/sync behavior for selected capability-level records.

The generated inventory is useful independently as a local structure/architecture knowledge layer, but registry query defaults to curated capabilities. A separate explicit query mode may expose bounded generated candidates with their untrusted status; it SHALL not mix them into trusted results.

**Why**: Automatic evidence collection makes initial population fast, while the generated/curated boundary prevents a noisy source index from becoming architectural authority.

**Alternatives rejected**:

- Curated-only registration leaves the first registry empty and requires manual rediscovery.
- Automatically promoting every export/tool creates thousands of low-value or unsafe recommendations.
- Full business-rule/data-model inference is nondeterministic and materially broader than reuse discovery.

### D16. Refresh from the last successfully scanned commit with fail-safe full fallback

Each `generated/projects/<project-id>.json` atomically contains both current generated facts and this checkpoint:

```json
{
  "scanState": {
    "scanRef": "refs/heads/main",
    "lastSuccessfulCommit": "<full-commit-sha>",
    "tree": "<full-tree-sha>",
    "scannerVersion": 1,
    "schemaVersion": 1,
    "scanPolicyHash": "<hash>",
    "mode": "initial"
  },
  "inventory": {},
  "candidates": []
}
```

On first bootstrap, the command determines a local default branch from existing local Git refs or uses the exact current branch when no default can be resolved, records that `scanRef`, and scans its committed tree. Future rescan resolves the local tip of the saved ref without fetch/pull. It materializes or reads the exact commit tree without observing dirty or untracked working-tree bytes.

Rescan behavior is:

- same prior/current full commit and identical scanner/schema/policy identity -> `no-op`;
- prior commit is an ancestor of current -> aggregate `git diff --name-status -M <prior>..<current>`, then incrementally rebuild changed/added/renamed/deleted file facts and the smallest safely known owning package/module scopes;
- changed workspace/package/build manifest, ambiguous owner/impact scope, or unsupported source transition -> broaden to the owning workspace/project and record the reason;
- prior commit missing or not an ancestor because of rebase, force-push, branch replacement, or shallow history -> full project rescan with `full-fallback` reason;
- scanner version, schema version, or scan-policy hash mismatch -> full project rescan;
- submodule Git links are recorded by commit and are scanned only when the submodule is also an explicitly selected project.

Deleted and renamed entrypoints update generated facts and mark intersecting curated capability/evidence paths `needs-review`; curated records are never silently deleted or rewritten. A changed file outside a curated entrypoint can still trigger review when it belongs to the same deterministically known owner/package. Unknown ownership broadens invalidation rather than claiming the record is current.

The scanner builds and validates the complete next generated project record before atomically replacing the prior single project file. `lastSuccessfulCommit` advances only with that validated replacement and a valid derived index. Any scan/write/validation/cleanup failure leaves the prior checkpoint and active record authoritative and preserves diagnostics/recovery state. Processing every intermediate commit is unnecessary because the product owns current knowledge, not historical evolution.

**Why**: Git commits provide a reproducible, cheap delta boundary. Co-locating checkpoint and generated facts in one atomically replaced project file prevents a checkpoint from advancing ahead of its inventory.

**Alternatives rejected**:

- Full rescan on every update wastes time and tokens for unchanged projects.
- Scanning the active working tree makes results unreproducible and can inventory uncommitted private work.
- Advancing the checkpoint before complete validation can permanently skip failed changes.
- Replaying every commit adds historical analytics cost without improving the current inventory outcome.

## Failure Model and Diagnostics

The client uses stable machine-readable status values such as `ok`, `degraded`, `invalid`, `stale`, `conflict`, and `blocked`. Failures preserve the original exception cause/stack at the CLI ownership boundary and emit privacy-safe operation context: operation, logical registry ID, logical project/capability ID when available, config source identity without secret content, and artifact path only when explicit diagnostic output permits it.

Expected failures include malformed or ambiguous free-form resolution, missing local registry checkout, Git URL without a local binding, unreadable registry, invalid/missing scan ref, missing/non-ancestor checkpoint, dirty-tree isolation failure, unsupported manifest/source transition, schema/scanner/policy mismatch, duplicate IDs, unknown group/project, unbound project, path escape, stale entrypoint, cache identity mismatch, output truncation requiring a narrower query, pending collision, registry write failure, index regeneration mismatch, and cleanup failure. Query failure never silently becomes an empty successful result. Failed bootstrap/rescan preserves the previous generated project record/checkpoint; sync preserves pending state.

## Migration Plan

1. Capture current instruction inventory, validation, tests, and same-model baseline workflows before loaded-policy mutation.
2. Add schemas, registry template, natural-language command shell, deterministic bootstrap/rescan/query core, and disposable fixture proof without activating the loaded new-mechanism trigger.
3. Prove the real local boundary for free-form resolution, initial bootstrap, incremental/no-op/full-fallback refresh, candidate promotion, query/privacy/stale/cache/outbox behavior, and checkpoint failure preservation.
4. Add the compact runtime trigger and lazy skill, consolidate superseded reuse wording, and run same-model candidate workflows.
5. Complete fresh Material critical-only SDET and project-native validation, then freeze the local candidate when no confirmed critical/non-deferrable defect remains.
6. Leave actual owner registry/project invocation unperformed. Document the simple `/reuse-inventory` prompt and first-run local-path resolution; do not clone or mutate a remote.

Rollback removes the runtime trigger and client exposure while preserving any private config, cache, and pending outbox bytes. Since the bounded increment creates no owner registry, dependencies, or remote state, repository rollback is local. A later activated registry remains an independent local repository and is never deleted by kit rollback.

## Risks / Trade-offs

- **[Generated inventory can be noisy or incomplete]** -> Keep it separate from curated capabilities, preserve source/evidence links, and require agent verification before promotion.
- **[Incremental file deltas can miss architecture impact]** -> Broaden to a deterministic package/workspace scope and full-rescan when ownership or impact is unknown; record every fallback reason.
- **[Rebase, force-push, shallow history, or scanner change invalidates the checkpoint]** -> Require ancestry and scanner/schema/policy identity; use a fail-safe full rescan without advancing the prior checkpoint on failure.
- **[Natural-language resolution can select the wrong project]** -> Resolve only named/configured identities, show the exact preview, and ask one question on ambiguity rather than enumerating or guessing.
- **[Schema-valid metadata can drift from source semantics]** -> Require source/evidence verification on every selection and mark missing/mismatched entries stale.
- **[A central catalog can become a bottleneck]** -> Keep product code completion independent through private pending outbox; sync is local and never remote-coupled.
- **[Discovery ceremony can erase token savings]** -> Use a precise trigger, bounded output, cheapest-first stop condition, lazy skill, and a zero-call trivial-fix acceptance scenario.
- **[Ready-made libraries can increase risk or ownership cost]** -> Require total-lifecycle-cost disposition and preserve project-native dependency/security authority.
- **[Exact lexical query can miss vocabulary variants]** -> Maintain concise keywords and let the agent issue a second narrower synonym query; do not add fuzzy scoring in this increment.
- **[Private names or paths can leak through diagnostics]** -> Keep groups/catalog private, emit logical IDs by default, redact roots, and test unallowlisted disclosure paths.
- **[Pending outbox can accumulate]** -> Surface pending count at status and at every triggered discovery; preserve conflicts for explicit resolution.
- **[Codebase Memory can be stale or unavailable]** -> Treat it only as selected-source navigation and verify actual source; registry query remains independently useful.
- **[Behavior comparison can be noisy]** -> Use identical model/profile/input/disposable environment, preserve raw traces, and assert observable decisions rather than a synthetic aggregate score.

## Open Questions

No current-increment product decision remains open. The owner's actual local registry checkout, enabled groups, target project bindings, and scan refs are first-run inputs resolved by the natural-language command; implementation proof uses only disposable values and never guesses or operates on owner paths. Remote backup/synchronization remains outside this change.
