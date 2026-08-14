# Stable Handoff

## Outcome

- Profile: `Material`
- Development-Stage: `stable`
- Stable Candidate: `RC1`
- Product Candidate: `simplify-r2`
- Live-Attempt Gate: clear
- External Operations: not performed

The local candidate preserves reuse-first discovery for new dependencies, reusable mechanisms/APIs, infrastructure, abstractions, and duplicate behavior while removing the unused private registry/inventory product. Trivial local, data, config, generated, mechanical, and selected-API glue work remains outside the trigger.

## Non-Goals and Envelope

- No private registry, scanner, generated inventory, cache, outbox, capability promotion, `/reuse-inventory`, or compatibility shim.
- No Graphify/provider installation or configuration, broad project enumeration, source copying, dependency installation, publication, remote mutation, archive, commit, push, release, or activation.
- Rung 2 proves fresh installed OpenCode behavior under a disposable no-product-mutation workspace with bash/edit/external/web/task/question denied. Rung 3 ordinary project use through an explicitly configured cross-project source remains future operation.

## Architecture and Diagnostics

- `global/AGENTS.md` owns one compact trigger/disposition.
- `global/skills/reuse-discovery/SKILL.md` owns the lazy ordered workflow: remove/narrow, current repository, platform/installed dependencies, explicitly configured cross-project source, bounded ecosystem, then `build-minimal`.
- Selected candidates require current-source/contract verification. Discovery data never grants mutation authority.
- Unavailable cross-project discovery is explicit `degraded`; absence of a useful layer may be `not-applicable`; a completed and source-verified layer is `verified`.
- The ignored machine-local instruction file remains the provider/project/refresh owner and was not modified.
- Owning proof diagnostics preserve argv, status, stdout/stderr, tool order, source hashes, exact disposition/cross-project facts, source stability, session deletion, root cleanup, and causes. Runtime stderr is empty in both current lanes.

## Evidence Topology

- Product Candidate hashes: `global/AGENTS.md` `09dcd9530c1a4ea1f176ab28c2bc39586acc91ff86e5ac79987681b0850c7514`; `global/skills/reuse-discovery/SKILL.md` `9c0f51aa607f04903ed16665299234e0c3637bfed160bb18df047eb340deb073`; README/package identities are in `candidate-reference.md`; removed command/CLI hashes are null.
- Proof Runner capture revision: `tools/proofs/reuse-discovery.ts` SHA-256 `9be9392552c11aa9bbe0155d01b2a60ed326504eeeff81fadffa380568ddfbba`.
- Evaluator revision: same source owner, SHA-256 `64a1dfe42ce8e0a14f742f0a5a9b0f96e64d0b84fbcd2f536d7e6b2752c283c3`; evaluator-only changes added no-bash facts and transactional output creation.
- Environment Identity: Windows, Node 24, OpenCode `1.18.18`, fresh primary `build`, `quality-independent`, `openai/gpt-5.6-sol/xhigh`, current global source, unchanged ignored local layer.
- Raw Evidence Bundle: `candidate-preflight-r3/preflight.json`, `candidate-sessions-r2/{local-owner,trivial-fix}.bundle.json`, `candidate-evaluation-r3/evaluation.json`.
- Triggered observation: skill loaded, current owners/candidates inspected, defective apparent parser rejected, disposition `extend`, `Cross-project: degraded`, no bash/registry call, no source change, status/cleanup green.
- Trivial observation: no bash/reuse skill/cross-project/registry call, one owner-local correction, no source change, status/cleanup green.

## SDET and Validation

- Fresh critical-only SDET: `no-critical-risk`; Effective Model `xai/grok-4.6`; no automated test edits. Main disposition is in `critical-sdet.md`; the root SDET stop is terminal.
- Focused contracts: 67 passed.
- Full `npm test`: passed.
- Strict instruction validation: passed with zero warnings.
- Instruction and code-quality inventories: passed; proof runner is 614 lines, an attention file below the 800-line split threshold with a recorded cohesion justification.
- Strict selected/all OpenSpec validation: passed; all validation returned 13/13.
- Apply operation gate and `npm run prepush:validate`: passed.
- Secret/path/reference review and `git diff --check`: passed after one evidence-only repo path was redacted.
- Exact command ledger and diagnostic-only failures: `final-validation.md`.

## Limitations

- A successful provider-specific cross-project lookup is not proved. The accepted safe lane proves explicit `degraded` behavior and current-source authority.
- Cross-project indexes can be stale, incomplete, noisy, or vocabulary-sensitive. They remain discovery data, not compatibility proof.
- Model/version behavior can drift. Current evidence is attributable only to the recorded environment.
- No latency improvement is claimed.
- Proof-only negative-oracle references to removed entrypoints remain; no product loader path exists.

## Restart and Rollback

- Existing OpenCode processes retain their already loaded catalogs. Start a new process after any later installation/activation to observe the changed command/skill catalog.
- No persisted data or migration exists. Before any later activation, source-level rollback can return to the pre-change commit, but that would also restore the unproved registry product and is not performed here.
- The predecessor is preserved under `openspec/changes/archive/2026-08-14-abandoned-adopt-reuse-first-capability-discovery/` with `ABANDONED.md`, unchecked tasks, unsynchronized specs, and its historical evidence. It is not a delivered or resumable current change.

## Repository State

- `simplify-reuse-first-discovery` remains the only active change and is complete locally.
- At the RC1 stable-handoff freeze, complete archive/spec synchronization had not yet been requested or performed. Any later owner-authorized archive is represented by the final archive directory and Git history, not by rewriting this pre-archive proof.
- At the RC1 stable-handoff freeze, no commit, push, merge, install, activation, deployment, release, publication, credential change, provider change, or remote-state mutation had been performed.
