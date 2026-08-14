# Final Validation

## Candidate

- Candidate Reference: `allow-unattended-sdet-edits-RC1`.
- Product behavior source captured by routed proof:
  `global/agents/sdet-quality-engineer.md` SHA-256
  `27b594045322baa9cbe65f5faa2c715b36409d50d49ce1b7368f48a9ef05faa8`.
- Contract source captured by routed proof:
  `tools/contracts/sdet-quality-engineer.ts` SHA-256
  `fec35a73e4f5537abbf7386b8a7733b507a4f30de1893f52087ce0d26b17538c`.
- Runtime Proof: `capture-r1` product facts plus terminal `replay-r1` cleanup
  composition; current runner route/cleanup is `preflight-r2`.
- Critical SDET: terminal `no-critical-risk`, child
  `ses_fff55e574ffextnn5Q5RfJZZRW`, Effective Model `xai/grok-4.6`, no test
  changes.

## Commands

| Command | Exit / Result |
| --- | --- |
| `npm run validate:strict` | `0`; skills 29, agents 18, markdown 407, warnings 0, infos 2 |
| `npm test` | `0`; Node test dot reporter completed all 11 configured test files |
| `npm run proof:permissions` | `0`; OpenCode 1.18.18, SDET `editPermission=allow`, declared specialist denies preserved |
| `openspec validate allow-unattended-sdet-edits --strict` | `0`; valid |
| `openspec validate --all --strict` | `0`; 16 passed, 0 failed |
| `node global/bin/openspec-operation-gate.ts --root . --operation apply --change allow-unattended-sdet-edits` | `0`; passed |
| `node --check tools/proofs/sdet-unattended-edit.ts` | `0` |
| `git diff --check` | `0` |

## Quality And Scope

- `npm run code-quality:inventory -- --format markdown` places
  `tools/proofs/sdet-unattended-edit.ts` at 460 lines in the attention band, below
  split-candidate. Its responsibilities remain one cohesive proof lifecycle:
  parse, route, capture/monitor, replay/evaluate, and cleanup.
- Fresh `code-quality-reviewer` child `ses_fff505f01ffeCmRXDEGBAhh9YL`, Effective
  Model `xai/grok-4.6`, found no safe net reduction. Existing shared session helpers
  are reused; extracting server lifecycle would merge incompatible environment and
  readiness contracts.
- Scoped source/evidence review found no credential values or secret-bearing output.
  The repository contains unrelated concurrent changes listed by `git status`; none
  were reverted, staged, or claimed by this change.

## Stage

- Development-Stage: `RC1`.
- Stable promotion waits only for the creation-authored final history retrospective
  and any exact-current-consumer improvement it admits.
