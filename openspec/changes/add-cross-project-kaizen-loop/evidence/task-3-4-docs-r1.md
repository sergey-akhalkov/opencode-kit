# Task 3.4 Operator Documentation Evidence

## Candidate

- Candidate: `cross-project-kaizen-loop-docs-r1`
- Environment: Windows, Node `v24.18.1`, provider-free documentation/source/readback validation
- Recorded: `2026-08-29T15:55:53.1037364+03:00`
- Effects: repository documentation and evidence only; no install, activation, restart, provider, network, data-store, target-project, or remote effect

## Current Source Identity

Ordered `git hash-object` identities:

| Path | Git blob |
| --- | --- |
| `README.md` | `f383d1cb52c3a8b54ba7ca872da25f16459c6703` |
| `docs/kaizen.md` | `a0dbcbe3950d49c9701e00c95c28abf074f26856` |
| `global/commands/kaizen-status.md` | `2f9d521a0ebd8035d47ae78c37b065b3321abd8e` |
| `global/commands/kaizen-triage.md` | `fa8b7520dcd5fddd7b307a6fd5f4951b58983cce` |
| `global/plugin/kaizen/index.ts` | `a750647a28a6116acac8724333c073b12afb8168` |
| `global/plugin/kaizen/store.ts` | `69364228d1ea3884c3f8fc925956a0fff616a2a1` |
| `global/skills/complain/SKILL.md` | `789aca09dd5890f34ee284b0345e84f2c43087e5` |
| `global/skills/openspec-archive-change/SKILL.md` | `73979eb04bcc0d661ed1376d4652f9705ded9cce` |
| `tools/proofs/cross-project-kaizen.ts` | `701cfada595febeb78dd2540ce81383d3938820c` |
| `evidence/task-3-4-documentation-ledger.md` | `e426ff78edfa2bca3372012aeb019bb959d7700d` |

## Documentation Hardening Result

- Verdict: material fixes applied.
- Scope: all 608 lines of `README.md` and all 171 lines of new canonical `docs/kaizen.md`.
- Fixed findings: stale core profile/plugin description, stale primary-Markdown feedback ownership, and missing operator guide.
- The guide covers default-on activation, `OPENCODE_KAIZEN=0`, restart and inert rollback, two commands, five tools, signal/compaction/archive states, fallback/import, proposal-owner states, data-root precedence and exact store layout, record/output bounds, privacy ceiling, inspection, exact all-store cleanup, maintained proof commands, effects, and non-goals.
- Conditional automatic compaction capture is explicitly unproved when the loaded managed prompt is not synchronized; preview/materialization is not represented as installation or activation.

## Executable Evidence

- `node tools/test-cross-project-kaizen.ts --json`: exit `0`; 26 named scenarios covered disabled no-write, explicit capture, closed schema, concurrency, capacity, compaction envelope, five-tool composition, owner-root containment, privacy, failure chains, fallback/import, archive states, repair gaps, copied plugin, and non-blocking compaction failures.
- `node tools/proofs/cross-project-kaizen.ts --help`: exit `0`; every documented provider-free, loaded, and replay mode was present.
- `node tools/install-opencode-global.ts --help`: exit `0`; documented profile and restart behavior was present.
- `npm run opencode:sources -- --root .`: exit `0` in task 3.3 evidence; active/template prompt relation was `different`, reason `content-differs`, with `synchronize-active-copy-and-restart` and no prompt text output.

## Validation

- `npm run validate:strict`: exit `0`, `OK: skills=34 agents=22 markdown=1023 warnings=0 infos=2`.
- `npm run instruction:inventory -- --format markdown`: exit `0`, context quality passed, deterministic errors `0`, review only `0`.
- Installed OpenSpec Node entrypoint `validate add-cross-project-kaizen-loop --strict`: exit `0`, change valid.
- `git diff --check`: exit `0`; only existing line-ending warnings were emitted.

## Claim Ceiling

This proves task 3.4 as a source-verified documentation map for current candidate behavior and explicit unknowns. Documentation does not prove installed activation, cold command following, current managed compaction capture, complete archive behavior, unknown-secret detection, proposal quality, SDET closure, an independent evidence challenge, or complete `KZN-001`.
