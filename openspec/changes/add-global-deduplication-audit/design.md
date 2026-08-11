## Context

The kit already has three relevant owners: `reuse-discovery` prevents new duplicate mechanisms, `code-quality-audit` reviews maintainability after non-trivial changes, and `codebase-audit-loop` owns explicit exhaustive audits. The existing read-only `code-quality-reviewer` returns a reduction matrix and protects unique critical/compatibility test oracles. None supplies an explicit, globally available, scoped clone-audit entrypoint.

`jscpd` v5 is a Rust-backed text/token clone detector distributed by the named upstream project as the npm package `jscpd@5`. Its output identifies locations and similarity, not semantic equivalence. The active machine points `OPENCODE_CONFIG_DIR` at this repository's `global/` directory, so a skill and command added there are globally loader-visible after restart without copying artifacts into each repository.

This is a Material loaded-instruction change. The Product Candidate is the global skill, command, profile/catalog registration, and their behavior contract. The machine CLI is Environment Identity. The proof runner drives disposable fixture scans and bounded fresh OpenCode sessions; deterministic contract assertions and offline scenario evaluation are the Evaluator.

## Goals / Non-Goals

**Goals:**

- Offer `/dedup <scope>` in any repository loaded through the kit global config.
- Keep `deduplication-audit` lazy and scoped, with no routine ceremony for trivial fixes.
- Use `jscpd` only for exact/near textual candidate discovery, then inspect symbols, owners, callers, tests, contracts, errors, effects, and lifecycle before recommending a reduction.
- Reuse `code-quality-reviewer` for independent read-only reduction evidence when a material candidate exists.
- Preserve unique critical and compatibility test oracles and reject abstractions that increase current concepts or coupling.
- Install `jscpd@5.0.14` as a machine-global CLI without changing repository dependency manifests.

**Non-Goals:**

- No automatic production edit, clone elimination, semantic-equivalence inference, custom detector, broad audit ledger, or default whole-repository scan.
- No `deduplicator` agent, upstream `jscpd` skill, upstream `dry-refactoring` skill, MCP server, repository package dependency, or config file written into target repositories.
- No requirement that ordinary coding tasks run deduplication unless the user explicitly invokes `/dedup` or asks for a scoped duplication audit.

## Decisions

### D1. Route explicit scoped intent directly to one lazy skill

`global/commands/dedup.md` forwards the complete `$ARGUMENTS` as the requested scope and instructs the running main agent to load `deduplication-audit`. The skill trigger covers explicit `/dedup`, deduplication audits, and clone analysis only. It explicitly excludes trivial local fixes and broad exhaustive audits.

This requires no new always-loaded `global/AGENTS.md` rule. Avoiding that shared file both preserves proportionality and prevents overlap with the active reuse-first change.

Alternative rejected: a mandatory pre/post-edit duplicate gate would add context and scans to unrelated local work and conflict with the accepted trivial-fix requirement.

### D2. Treat jscpd as a candidate generator with a read-only invocation envelope

The workflow verifies `jscpd --version`, resolves one explicit repository-contained scope, and invokes the CLI with its default gitignore behavior, an AI/compact reporter, no threshold reporter, and explicit ignore globs for generated, vendor, build, cache, coverage, output, and dependency directories. It never passes `--no-gitignore`, never writes `.jscpd.json`, and never treats exit success, clone counts, or clone similarity as semantic evidence.

Target project source is not modified. Report files are avoided for ordinary invocation; immutable proof may redirect stdout/stderr into the change's evidence directory. Missing CLI produces an actionable blocked tool layer rather than an implicit package install in another repository.

Alternative rejected: a repository dependency or custom wrapper/detector would add lifecycle ownership without changing the core user outcome.

### D3. Enrich only material clone candidates with repository evidence

For each material candidate, main inspects both locations and searches the selected scope for:

- declarations, symbols, exports, and owning modules;
- callers/importers and current integration paths;
- tests, fixtures, snapshots, compatibility contracts, and unique failure oracles;
- input/output contract, error mapping, side effects, mutation, I/O, timing, concurrency, cleanup, activation, and lifecycle differences.

Code graph/LSP relationships are preferred when the exact current repository identity is available; targeted source search remains authoritative. The workflow does not enumerate unrelated indexed projects. A missing relationship or test signal is reported as `not proven`, never inferred.

Alternative rejected: judging from clone snippets alone cannot distinguish deliberate protocol/compatibility copies from safely shared behavior.

### D4. Use one closed classification and recommendation vocabulary

Each candidate is classified as exactly one of `exact duplicate`, `near duplicate`, `overlapping responsibility`, `redundant wrapper`, `keep separate by design`, or `not proven`. Each material row includes locations, canonical owner, differences in contract/errors/effects/lifecycle, retained test oracles, one recommendation from `remove | reuse | extract | parameterize | keep separate`, estimated net line/concept delta, coupling effect, confidence, and required runtime proof.

`extract` and `parameterize` are permitted only when they remove current concepts or branches without increasing coupling or public surface. A textual clone with materially different semantics becomes `keep separate by design` or `not proven`.

Alternative rejected: a generic DRY score or automatic strategy mapping would encode judgment in deterministic tooling and overstate evidence.

### D5. Reuse code-quality-reviewer without creating another role

After main has bounded and enriched at least one material candidate, it may dispatch the existing `code-quality-reviewer` with exact source/test locations and the current candidate reference. Its reduction matrix is independent evidence only. Main reconciles it with clone and repository evidence, classifies rows, and owns every later production decision.

The reviewer never runs `jscpd`, edits files, asks the user, or authorizes refactoring. No candidate means no reviewer launch is required.

Alternative rejected: a `deduplicator` agent would duplicate the current reduction-review owner and invite write authority at the audit boundary.

### D6. Keep audit and implementation as separate boundaries

`/dedup` is read-only. Any accepted reduction is a later main-owned production slice with an explicit behavior contract and representative Runtime Proof. Main makes the smallest reduction, retains named critical/compatibility oracles, and re-proves affected callers and lifecycle. Clone disappearance alone is never sufficient proof.

Alternative rejected: automatic refactoring couples noisy detection to mutation and cannot preserve unknown contracts safely.

### D7. Install one pinned machine-global v5 CLI

Use the upstream-documented npm global method with exact package `jscpd@5.0.14`, then record `jscpd --version`, executable resolution, and global package inventory without printing unrelated environment or credentials. No package or lockfile in this repository changes. The upstream skills remain absent from every inspected global skill source.

Alternative rejected: `npx`, repository devDependency, cargo, or upstream skill installation would either make each invocation network-dependent, mutate the repository, add another toolchain route, or import policy that does not follow kit authority.

### D8. Prove structure, real CLI behavior, and instruction behavior separately

Fidelity ladder:

1. Static contract/loader/routing assertions and preserved baseline prompts.
2. Actual `jscpd` v5 execution against a disposable fixture and bounded repository scope.
3. Fresh same-model OpenCode sessions through the real global command/skill loader for six scenarios.
4. Future audits and production reductions in unrelated owner repositories, outside this change.

The same-model scenarios use identical baseline/candidate model, workspace shape, tool envelope, and synthetic inputs. Oracles check local-owner discovery, exact clone classification, semantic caution for near clones, retention of a unique compatibility test, a no-match helper disposition, and no dedup skill/CLI/reviewer ceremony for a trivial fix. Deterministic evaluators assert explicit observed facts and never compute a quality score.

## Failure Model and Diagnostics

The command reports invalid/empty/outside-repository scope, missing or wrong-major CLI, CLI non-zero exit, unreadable clone locations, unsupported formats, incomplete caller/test evidence, scope truncation, and reviewer unavailability separately. It preserves exact invocation, scope, CLI version, exit status, stdout/stderr, observed source hashes or status, and evidence paths. It never converts a failed scan into "no duplicates" and never logs source snippets outside the requested scope.

## Migration Plan

1. Freeze baseline structure and six behavior prompts before Product Candidate mutation.
2. Install and verify `jscpd@5.0.14` globally; run provider-free disposable and bounded scans.
3. Add the lazy skill and command, then prove real loader discovery and the smallest command happy path.
4. Complete same-model behavior evaluation, fresh critical-only SDET contract tests, full validation, and local handoff.
5. Restart OpenCode after source changes so future sessions load the new command and skill.

Rollback removes the two new global artifacts and profile/catalog entries. The machine CLI can be removed separately with the same package manager if the owner later requests it; rollback never deletes reports or source in another repository.

## Risks / Trade-offs

- **[Token/text clones are noisy]** -> Require semantic enrichment and permit `keep separate by design` or `not proven`.
- **[Static relationship search is incomplete]** -> Report evidence gaps and require caller-level Runtime Proof before any later mutation.
- **[Broad scope can consume time/context]** -> Require explicit scope, compact reporter output, bounded candidate selection, and no exhaustive-audit escalation.
- **[Ignore conventions differ by project]** -> Preserve default `.gitignore` behavior and add conservative generated/vendor/build/dependency exclusions without writing target config.
- **[Global npm PATH can drift]** -> Preserve exact installation/version/source evidence and fail actionably when future sessions cannot resolve the CLI.
- **[A generic helper increases coupling]** -> Require negative concept/coupling delta before `extract` or `parameterize`.

## Open Questions

None for this increment. Production refactoring of any discovered repository candidate is a separate owner-visible task with its own accepted contract and proof.
