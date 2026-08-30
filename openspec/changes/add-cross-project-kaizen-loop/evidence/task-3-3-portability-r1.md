# Task 3.3 Portability Evidence

## Candidate

- Candidate: `cross-project-kaizen-loop-portability-r1`
- Environment: Windows, Node `v24.18.1`, provider-free core/all preview and disposable materialization
- Recorded: `2026-08-29T15:45:31.8849689+03:00`
- Effects: temporary materialized profile roots only; no install, activation, restart, provider, network, target-project, or remote effect

## Current Source Identity

Ordered `git hash-object` identities:

| Path | Git blob |
| --- | --- |
| `profiles/core.json` | `18cce895698c026a146da014aaba91d1bd652102` |
| `profiles/all.json` | `097e048f8a9e5bfc2c2407338a9fc558456f4f5a` |
| `global/commands/kaizen-status.md` | `2f9d521a0ebd8035d47ae78c37b065b3321abd8e` |
| `global/commands/kaizen-triage.md` | `fa8b7520dcd5fddd7b307a6fd5f4951b58983cce` |
| `global/plugin/session-env.ts` | `a737c42189a5969e106ea6f7f3622bc086ac6b1a` |
| `global/plugin/kaizen/index.ts` | `a750647a28a6116acac8724333c073b12afb8168` |
| `global/plugin/kaizen/store.ts` | `69364228d1ea3884c3f8fc925956a0fff616a2a1` |
| `global/plugin/project-memory/store.ts` | `63795fe2aec854d40795813733f8a1d88d8c0f74` |
| `global/plugin/session-delivery-context/index.ts` | `9799e25fddcaecef05e1e1d7f379cdad83fa5dca` |
| `tools/runtime-surface-profile.ts` | `f9e1485c5871a24de8d4322299652a1ace39f02c` |
| `tools/test-library/runtime-surface-profiles.ts` | `e81db47283a523a43896a3bcae1603a395b7f28d` |
| `tools/proofs/README.md` | `cb9a9d81e436fdfd3ba62075d50e566f16e8f310` |

## Runtime Proof

- `node tools/install-opencode-global.ts --preview-profile --profile core`: exit `0`; preview exposed `command:kaizen-status`, `command:kaizen-triage`, and one `path:plugin`; no file or environment value changed.
- `node tools/install-opencode-global.ts --preview-profile --profile all`: exit `0`; preview exposed both Kaizen commands and one `path:plugin`; no file or environment value changed.
- `node tools/opencode-runtime-sources.ts --root .`: exit `0`; active/template compaction prompt markers matched while content differed, status was `different`, reason was `content-differs`, and restart boundary was `synchronize-active-copy-and-restart`. The source inventory exposed both Kaizen commands and the active `session-env` plugin without reading prompt text.
- `git hash-object global/opencode.json` before and after previews: both `fa303ec08f834bc8bc0f1dcf7819a1a53e09356c`; the gitignored machine config remained byte-identical.
- `node tools/test-library.ts`: exit `0`, `OK: library tests=188`. Materialized core/all trees byte-matched their manifests; core loaded exactly `plugin/session-env.ts` plus `extensions/specialist-catalog.ts`; Kaizen commands and representative transitive plugin files existed; generated config retained final-root paths; rollback and machine-config preservation cases passed.
- `node tools/test-cross-project-kaizen.ts`: exit `0`, `26 cross-project Kaizen tests passed`, including disabled no-write and copied `session-env` Kaizen report/status behavior.
- `node tools/test-session-env-plugin.ts`: exit `0`, `OK: session env plugin tests=18`, including copied-plugin directory execution and unrelated tool preservation.

## Validation

- `npm run validate:strict`: exit `0`, `OK: skills=34 agents=22 markdown=1020 warnings=0 infos=2`.
- Installed OpenSpec Node entrypoint `validate add-cross-project-kaizen-loop --strict`: exit `0`, change valid.
- `node tools/proofs/cross-project-kaizen.ts --help`: exit `0`; maintained provider-free, loaded, and replay modes remained discoverable.
- `git diff --check`: exit `0`; only existing line-ending warnings were emitted.

## Claim Ceiling

This proves task 3.3 at current source, effect-free installer preview, disposable materialization, copied-plugin, runtime-source diagnostics, and machine-config preservation boundaries. It does not install or activate a profile, restart OpenCode, prove cold model command following, complete managed compaction capture, supply operator documentation, run critical SDET or an independent evidence challenge, or complete `KZN-001`.
