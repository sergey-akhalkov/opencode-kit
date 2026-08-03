# Validation Evidence

## Candidate

- Baseline Git commit: `01e5c4bc7824d98a310d3a63c3a2f1b0c3d21396`
- Runtime proof reference: `pre-sdet-qas-2026-08-03-1`
- SDET terminal action: `no-critical-risk`

## Commands

| Command | Exit | Observation |
| --- | ---: | --- |
| `node tools/test-library.ts` | 0 | `OK: library tests=339`; exact SDET execution request. |
| `node tools/test-contracts.ts` | 0 | `OK: contracts tests=56` after historical archive-path and mirror-marker corrections. |
| `npm test` | 0 | All repository suites passed: library 339, model profile 16, validation scripts 3, contracts 56, code-quality 4, Headroom 11, session plugin 15, feedback 12, init 3, installer 23, OpenSpec gate 8, prepush 8. |
| `npm run validate:strict` | 0 | `warnings=0`, `infos=2`; exact global template and machine-local allow remain visible as informational diagnostics. |
| `npm run instruction:inventory -- --format markdown` | 0 | 53 artifacts, 4,188 lines, token proxy 84,098; `global/AGENTS.md` token proxy 13,278. Both remain below baselines 84,513 and 13,279. |
| `npm run code-quality:inventory -- --root . --format markdown --attention-lines 400 --split-lines 800` | 0 | Existing split-candidate signals reported without hard line-count failure. |
| `npm run openspec:validate` | 0 | 9 passed, 0 failed. |
| `npm run openspec:gate -- --operation prepush` | 0 | Operation gate status `passed`. |
| `git diff --check` | 0 | No whitespace errors. |

## Architecture Disposition

- `tools/test-library/validator-change-ready.ts`: remains the existing cohesive owner for Change-Ready routing/authority validator fixtures. The SDET additions extend that responsibility; extracting only the new cases would reduce locality.
- `tools/test-library/validator-2.ts`: remains the existing cohesive owner for general validator/config fixtures. The SDET additions are adjacent permission-path cases; no new responsibility was introduced.
- `tools/test-contracts-change-ready-identity.ts`: the archive-path adjustment preserves historical evidence lookup inside its existing identity-contract responsibility.
- Other reported split-candidate files were not changed by this outcome and remain pre-existing parked debt.

## Diagnostics And Residuals

- `npm test` emitted the existing Node `MODULE_TYPELESS_PACKAGE_JSON` performance warning for `global/plugin/session-env.ts`; all plugin tests passed. This unrelated non-critical warning is parked.
- Global `permission: allow` is an owner-accepted autonomy trade-off. It remains permissive tool configuration rather than managed or OS-level enforcement; runtime protected-boundary instructions and unrelated-config warnings remain in place.
