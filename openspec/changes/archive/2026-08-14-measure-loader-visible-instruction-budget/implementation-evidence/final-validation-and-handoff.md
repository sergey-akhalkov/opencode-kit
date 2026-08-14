# Final Validation And Local Handoff

## Outcome And Candidate

- Change: `measure-loader-visible-instruction-budget`.
- Candidate Reference: `loader-visible-budget-candidate-2`.
- Outcome: Maintainers can invoke the existing catalog inventory unchanged or select one project for a bounded, privacy-safe loader-visible inventory, then validate the kit against one limits-only checked-in budget seed.
- Product Candidate: `tools/instruction-artifacts-inventory.ts`, `tools/opencode-runtime-sources.ts`, `tools/instruction-budget.ts`, `tools/validate-library.ts`, `config/instruction-budget.json`, and package entrypoints.
- Proof Runner: `tools/proofs/instruction-inventory-budget.ts`, using `global/bin/portable-process.ts::runPortableCommand`.
- Evaluator: the pure preserved-bundle evaluator in the proof runner; offline replay does not invoke product commands.
- Environment Identity: Windows `win32`, Node `v24.18.0`, npm package entries, and OpenCode CLI `1.18.18` observed during implementation context. No OpenCode provider or model is involved in this proof.
- Source SHA-256 identities for the seed, portable process owner, inventory, budget, runtime-source manifest, and proof runner are preserved in `runtime-proof-2/raw.json`.

## Runtime Proof

- Capture command: `npm run proof:instruction-budget -- --mode capture --candidate-id loader-visible-budget-candidate-2 --evidence-root openspec/changes/measure-loader-visible-instruction-budget/implementation-evidence/runtime-proof-2`.
- Capture result: exit `0`; all 17 facts passed.
- Raw Evidence Bundle: `implementation-evidence/runtime-proof-2/raw.json`.
- Evaluator result: `implementation-evidence/runtime-proof-2/evaluation.json`; raw SHA-256 `bb5a341a46171e3cd6efd0047f6e16e29840802c12f5092f3108907f02da0b16`.
- Replay command: `npm run proof:instruction-budget -- --mode replay --candidate-id loader-visible-budget-candidate-2 --input-root openspec/changes/measure-loader-visible-instruction-budget/implementation-evidence/runtime-proof-2 --evidence-root openspec/changes/measure-loader-visible-instruction-budget/implementation-evidence/runtime-proof-2-replay`.
- Replay result: exit `0`; the same 17 facts and raw SHA-256 passed without product invocation.
- Representative observations: default and explicit catalog reports are deep-equal version 1 objects; loader-visible version 2 reports two on-demand bodies, separate metadata, nine startup candidates, and six unknowns in the synthetic envelope; current and materialized budgets pass; one token-proxy growth and malformed seed fail non-zero; fixture cleanup is `removed=true`.
- Diagnostics: the raw bundle preserves redacted argv, exit status, signal, error, stdout, and stderr for every product command plus before/after fixture manifests. Expected growth and malformed lanes are the only non-zero commands.
- Live-Attempt Gate: clear. The boundary is local, provider-free, disposable, reversible, and green.

## Validation

| Command | Result |
| --- | --- |
| `npm run validate:strict` | Exit `0`; `skills=29 agents=18 markdown=410 warnings=0 infos=2`. The two infos are the existing intentional global broad-permission diagnostics. |
| `npm run test:focused:library` | Exit `0`; `OK: library tests=153` after fresh SDET test additions. |
| `npm test` | Exit `0`; all 11 configured Node test entries completed under the dot reporter. |
| `openspec validate measure-loader-visible-instruction-budget --strict` | Exit `0`; change is valid. |
| `npm run instruction:budget -- --format markdown` | Exit `0`; catalog `100519/100519`, global authority `16646/16646`. |
| `npm run code-quality:inventory -- --root . --format markdown --attention-lines 400 --split-lines 800` | Exit `0`; repository has pre-existing split candidates. Touched production owners are attention-only: runtime sources 628, inventory 502, proof runner 483. |
| `git diff --check` | Exit `0`; no output. |

## Critical SDET

- Fresh test-only session: `ses_fff0c6010ffe2S99kNc1JCg4yz`.
- Effective Model: `xai/grok-4.6`.
- Terminal action: `no-critical-risk`; this first precondition-valid no-confirmed-critical attempt permanently stops SDET for this root.
- Added real-CLI oracles cover catalog compatibility; JSON/Markdown content, path, vendor, and secret redaction with null-metric unknowns; budget growth/malformed fail-closed behavior; and consumer no-budget behavior.
- No production, config, seed, spec, instruction, docs, or proof-runner file was changed by SDET.

## Budget And Privacy Contract

- `config/instruction-budget.json` is the sole seed and contains only `schemaVersion` plus reviewed maxima. Current measurements, hashes, ordering, and drift remain derived.
- The current maxima freeze inherited debt; they do not claim optimization. Historical lower reduction targets remain `84,513` for the catalog and `13,279` for committed `global/AGENTS.md`.
- Token proxy is `ceil(chars / 4)`. It is not provider tokenization or an exact prompt-cost claim.
- Loader-visible output contains aggregate metrics, evidence classes, unknown reasons, and redacted source identities only. It contains no instruction text, repeated-line samples, config values outside supported instruction paths, provider values, credentials, or external absolute paths.
- Remote URLs, globs, inline config, malformed config, unsupported entries, and missing/non-file/unreadable sources remain explicit unknowns with null metrics.
- Presence and config declaration do not prove final prompt inclusion or precedence. OpenCode loader changes remain a material residual risk requiring future source/proof refresh.

## Architecture And Diagnostics

- `tools/opencode-runtime-sources.ts` remains the bounded runtime/config source-discovery owner; it inspects only fixed files and direct artifact directories up to the nearest Git boundary.
- `tools/instruction-artifacts-inventory.ts` remains the inventory CLI/report owner for compatible catalog v1 and separate loader-visible v2 output.
- `tools/instruction-budget.ts` is the one seed materialization/validation owner; `validate-library` only activates it for the owning `opencode-dev-kit` package.
- `tools/proofs/instruction-inventory-budget.ts` remains one cohesive capture/evaluator/cleanup owner. Its fixture paths are local return values, not process-global state.
- Split-or-justify: no touched production file is a split candidate. Each attention file retains one cohesive responsibility; extracting wrappers would add navigation without removing a mixed owner.
- Failures retain cause-preserving, privacy-safe diagnostics at the CLI boundary. No instruction/config content is included in error text.

## Rollback And External Operations

- Rollback is a scoped inverse patch removing loader-visible mode, budget integration/seed, proof runner/docs, and focused tests while retaining the unchanged default catalog CLI.
- No persisted consumer data, migration, remote state, provider session, installation, activation, publication, release, commit, push, or credential change requires restoration.
- External operations: none.
- Known non-critical limitations: Windows chmod-style unreadable regular files were not forced separately; missing/non-file, malformed, remote, glob, non-string, and inline cases cover the accepted unknown behavior. Final prompt composition, precedence, and exact provider tokenization remain unsupported.
- Deferred optional reduction: `DIC-1` in `history.md` may inline one private catalog-builder alias during a future independently required catalog edit; it does not block this outcome.

Development-Stage: MVP
