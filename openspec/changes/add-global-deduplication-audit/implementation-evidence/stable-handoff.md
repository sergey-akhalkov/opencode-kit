# Stable Local Handoff

## Outcome

The kit now provides a globally discoverable, lazy `deduplication-audit` skill and `/dedup <scope>` command. It invokes machine-global `jscpd` v5 only for bounded textual candidate discovery, enriches material candidates with ownership/caller/test/contract/effect/lifecycle evidence, reuses `code-quality-reviewer`, and stops before production mutation.

## Scope And Non-Goals

- Included: global skill/command, all-profile and README registration, npm-global `jscpd@5.0.14`, maintained proof runner/inventory, focused contract/loader/routing tests, six-scenario behavior evidence, terminal critical SDET, and full local validation.
- Excluded: custom clone detector, repository `jscpd` dependency, upstream `jscpd` or `dry-refactoring` skills, a `deduplicator` agent, automatic merge/refactor/test deletion, exhaustive `codebase-audit-loop`, or any real production reduction.
- Trivial local fixes remain free of dedup skill, CLI, reviewer, and exhaustive-audit ceremony unless the user explicitly requests a scoped audit.

## Candidate Reference

- Candidate: `dedup-candidate-1` / `RC1`.
- `global/skills/deduplication-audit/SKILL.md`: `ce788616ae0df0689ec6d95c107d209da4d3c52f6e038421a29c8546d0bc5071`.
- `global/commands/dedup.md`: `4f403b94a6b7d75045506a95eea169a293692bde946ef0b1b80be9bd6d3223b3`.
- `profiles/all.json`: `50fb2fadb735d1b384a5e223f1a53a88016772468540af3bedb28346fc90dcfb`.
- `README.md`: `073293e65611be98683897a48d0dd81f70ae16947fd9d4681032a0186d54f1a3`.
- Existing `global/agents/code-quality-reviewer.md`: unchanged hash `56a0d1020434314697a27db1abfcb6ab39d7ff08eec954db0e17bc2c25e7195a`.
- Proof Runner: `tools/proofs/deduplication-audit.ts`, hash `04b2716ad97b61664f9ef6a65fa76e3ec744df0994ad764ea3bbe9b39aa87784`.

## Evidence Topology

- Product Candidate: skill, command, profile/catalog registrations.
- Proof Runner: `tools/proofs/deduplication-audit.ts`; direct `opencode run` is justified because the accepted boundary is fresh primary slash-command expansion, which the shared SDK helper does not provide.
- Evaluator: runner preflight/CLI/evaluate/sanitize/scenario-preflight modes and `tools/test-contracts-deduplication.ts`.
- Environment Identity: OpenCode `1.18.16`, `quality-independent` route, Node/npm versions, machine-global `jscpd@5.0.14`.
- Raw Evidence: baseline, original/corrected candidate, CLI, loader, final runtime, SDET, and validation bundles under this `implementation-evidence/` directory.

## Runtime Proof

- Real installed CLI: `final-cli-proof/cli-proof.json` reports `cpd 5.0.14`, one controlled fixture clone, three bounded `tools/validators` candidates, exit `0`, no ignored locations, byte-identical source, and cleanup removed.
- Real global loader: `final-candidate-preflight/preflight.json` reports `dedupSkillLoaded=true`, exact final permission, `quality-independent` route, and cleanup removed.
- Real `/dedup` command: `final-runtime-proof/exact-clone.bundle.json` records `/dedup src`, lazy skill load, installed CLI calls, symbol/caller/test inspection, existing `code-quality-reviewer`, `exact duplicate`, canonical owner, required Runtime Proof, exit `0`, unchanged source hashes, and deleted session/root.
- Six-scenario behavior: `behavior-evaluation-final/evaluation.json` reports complete baseline/candidate corpus and `candidateOraclesPass=true`; original mismatched corpus remains expected-red for evaluator discrimination.

## Architecture

- `global/skills/deduplication-audit/SKILL.md` owns audit policy and output contract only.
- `global/commands/dedup.md` is a thin global route carrying the full `$ARGUMENTS` scope intent.
- `tools/test-contracts-deduplication.ts` owns deterministic structural oracles and explicitly does not claim semantic/runtime proof.
- `tools/proofs/deduplication-audit.ts` is larger but cohesive around one evidence boundary: disposable workspace setup, fresh command capture, real CLI capture, sanitation, and explicit offline evaluation share candidate/environment/cleanup state. Split-or-justify: retained as one runner to avoid duplicating privacy, session cleanup, fixture identity, and bundle schema across tiny mode wrappers.
- Shared `profiles/all.json` and README changes are additive catalog entries only. `global/AGENTS.md` and active reuse-first artifacts remain untouched by this change.

## Diagnostics And Validation

See `final-validation.md`. Focused contracts, strict library validation, full `npm test`, OpenSpec all/strict, repository-native prepush validation, current CLI proof, loader preflight, and frozen exact Runtime Proof are green. The unsupported planned OpenSpec `prepush` operation is preserved and corrected to the repository-native command.

## Critical SDET

- Terminal state: `Action: no-critical-risk` on the first precondition-valid fresh attempt.
- Effective Model: `xai/grok-4.5`.
- Confirmed critical corrections after SDET: none.
- Evidence: `critical-sdet.md` and the two test-only changed files.

## Host Installation

- Method: `npm install --global jscpd@5.0.14`.
- Resolved command: `%APPDATA%\npm\jscpd.ps1` for the current user, available from any repository on this user's PATH.
- Version: `jscpd --version` -> `cpd 5.0.14`.
- No repository dependency or upstream skill was installed.

## Known Non-Critical Limitations

- `jscpd` tokenization/thresholds can miss semantic duplication and emit false positives; the workflow reports this as candidate evidence only.
- Static symbol/caller/test evidence can be incomplete in dynamic or generated integration paths; missing evidence remains `not proven` and later production work requires caller-level Runtime Proof.
- npm-global availability follows the current user's Node/npm prefix and PATH; another Windows account or future Node prefix change may require a separately authorized reinstall.
- Running OpenCode sessions do not hot-reload config-time artifacts. Quit and restart OpenCode before using `/dedup` in a normal session; fresh proof processes already confirmed loader behavior.
- Fresh code-quality review found one optional 50-65-line consolidation across two positive structural test cases. It is parked as non-critical test-only cleanup; all unique discovery, absence, negative-mutation, compatibility, and live-disk immutability oracles remain present. See `code-quality-review.md`.

## Rollback

- Instruction rollback: remove the new skill/command and their profile/README/test/proof registrations, then restart OpenCode. Do not alter the existing reviewer or active reuse-first change.
- Host rollback, only if separately requested: `npm uninstall --global jscpd`; no repository package cleanup is needed.
- No target repository or production state requires restoration because every audit/proof was read-only and disposable.

## External Operations

- Performed: authorized npm registry download/install of pinned `jscpd@5.0.14`; bounded non-sensitive configured-provider calls for baseline/candidate proof and existing reviewer behavior.
- Not performed: commit, push, merge, archive, release, publication, production deployment, remote VCS mutation, upstream skill installation, or real production refactor.

Development-Stage: stable

Stable Candidate: RC1
