## Why

The global kit can request maintainability review, but it lacks an explicit bounded workflow that combines clone detection with symbol, ownership, caller, and test evidence before recommending deduplication. A global `/dedup <scope>` entrypoint and lazy skill are needed so users can request this analysis in any repository without turning ordinary local fixes into mandatory ceremony or treating textual similarity as semantic proof.

## Outcome Capsule

- **Outcome**: Provide a globally available `/dedup <scope>` command and lazy-loaded `deduplication-audit` skill that use machine-installed `jscpd` v5 to find candidates, enrich them with repository evidence, reuse `code-quality-reviewer`, and return safe reduction recommendations without editing production code.
- **Operating Envelope**: Explicit user-selected local repository scopes; read-only `jscpd` scans that respect `.gitignore` and exclude generated, vendor, build, and dependency directories; local symbol/owner/caller/test inspection; bounded synthetic evaluation in disposable workspaces; machine-global `jscpd@5.0.14` installation through npm.
- **Non-Goals**: No custom clone detector, repository dependency, upstream `jscpd` or `dry-refactoring` skill installation, new `deduplicator` agent, automatic refactor, exhaustive whole-codebase audit, semantic-equivalence claim from clone output, or mandatory workflow for trivial local fixes.
- **Non-Deferrable Invariants**: Clone reports remain candidate evidence only; every material recommendation names contract/error/effect/lifecycle differences and retained critical/compatibility test oracles; unique critical or compatibility oracles are never removed; no helper or abstraction is recommended unless current concepts and coupling decrease; scope and ignore boundaries are enforced; only main may implement later production slices after separate runtime proof.
- **Observable Proof**: The installed CLI reports `5.0.14`; a disposable fixture scan detects a controlled clone without modifying source; a bounded repository scan excludes ignored/generated/dependency paths; the live global loader exposes `/dedup` and lazy skill behavior; same-model baseline/candidate scenarios cover a local owner, exact clone, semantically different near clone, unique compatibility test, no-match helper, and trivial fix without ceremony.
- **Material Residual Risks**: `jscpd` thresholds and language tokenization can produce false positives or miss semantic duplication; static caller/test discovery can be incomplete; global npm installation follows the active Node/npm environment and may require PATH refresh in future shells.
- **Stop Line**: Stop when the global skill/command, profile/catalog integration, machine CLI installation evidence, bounded scans, loader/routing contracts, required behavior evaluation, fresh critical SDET, project-native validation, and local stable handoff are complete. Refactoring reported candidates and organization-wide clone policy remain separate work.

## What Changes

- Add global lazy-loaded `deduplication-audit` guidance with explicit classifications, evidence fields, safety constraints, and reduction output contract.
- Add global `/dedup <scope>` orchestration that remains scoped and read-only and delegates optional reduction review to the existing `code-quality-reviewer`.
- Install and verify machine-global `jscpd@5.0.14` without adding it to repository manifests.
- Add focused contract, loader, routing, disposable scan, and baseline/candidate behavior evidence.
- Record that upstream `jscpd` and `dry-refactoring` skills and a `deduplicator` agent are intentionally absent.

## Capabilities

### New Capabilities
- `library-deduplication-audit`: Defines the global command, lazy skill, `jscpd` candidate boundary, evidence enrichment, classification/recommendation schema, safety rules, machine CLI installation, and scoped proof behavior.

### Modified Capabilities
- `library-instruction-artifacts`: Adds a reusable global command/skill pair with deterministic structural contracts and same-model behavior evaluation while preserving lazy loading and trivial-fix proportionality.

## Impact

- Global OpenCode artifacts: `global/skills/deduplication-audit/SKILL.md`, `global/commands/dedup.md`, and the all-artifacts profile/catalog.
- Validation and proof: focused contract tests plus a maintained proof runner/evidence under the existing `tools/proofs/` convention.
- Host state: npm global installation of `jscpd@5.0.14`; no repository package manifest or lockfile dependency change.
- Existing roles: `global/agents/code-quality-reviewer.md` is reused unchanged; no new agent is introduced.
