# Candidate Continuity

## References

- Production Runtime Proof candidate: `pre-sdet-qas-2026-08-03-1`
- Current complete candidate: `qas-candidate-post-sdet-2026-08-03-1`
- Baseline Git commit: `01e5c4bc7824d98a310d3a63c3a2f1b0c3d21396`

## Post-Proof Delta Classification

| Delta | Evidence role | Dependent evidence impact |
| --- | --- | --- |
| `tools/test-library/validator-change-ready.ts` | SDET test-only evaluator | Added critical marker/fence/duplication oracles; does not alter production Runtime Proof. |
| `tools/test-library/validator-2.ts` | SDET test-only evaluator | Added exact/near-miss permission-path oracles; does not alter production Runtime Proof. |
| `REPO_AGENTS.md` self-contained marker restoration | Maintained project mirror outside active global runtime | Required affected contract/strict validation replay; does not alter the fresh global-runtime behavior lane or SDET's global/config scope. |
| `tools/test-contracts-change-ready-identity.ts` archive path | Historical test-only evaluator | Required affected contract/full test replay; does not alter production behavior. |
| OpenSpec task markers and implementation evidence | Report/evaluator metadata | Requires document validation only; does not alter product observations. |

No post-proof mutation changed `global/AGENTS.md`, `tools/contracts/skills.ts`, `tools/validators/routing.ts`, or `tools/validators/opencode-config.ts`. The recorded runtime proof and terminal SDET therefore remain attributable to their dependent production slice; the current complete candidate additionally carries green post-SDET and archive/mirror validation.
