# Task 2.3 Complain And Legacy Import Evidence

## Candidate

- Candidate: `cross-project-kaizen-loop-complain-r1`
- Environment: Windows, Node `v24.18.1`, copied `global/plugin/session-env.ts`, provider-free
- Recorded: `2026-08-29T14:25:45.1270525+03:00`
- Effects: isolated temporary roots and OpenCode data only; zero provider/network calls; no source-project feedback write on inbox/import paths; fixtures removed by the focused test

## Current Source Identity

Ordered `git hash-object` identities:

| Path | Git blob |
| --- | --- |
| `global/plugin/kaizen/index.ts` | `0f81b7f7648297214bd873d4b316b5378d8af2f7` |
| `global/plugin/kaizen/store.ts` | `c5cecadb20952b1f3e19b27356bfc899bbf58d14` |
| `global/plugin/kaizen/legacy-feedback.ts` | `113021f083089730716630c3f344ef7967c4b872` |
| `global/plugin/session-env.ts` | `a737c42189a5969e106ea6f7f3622bc086ac6b1a` |
| `global/skills/complain/SKILL.md` | `789aca09dd5890f34ee284b0345e84f2c43087e5` |
| `docs/feedbacks/README.md` | `43f4a7422f7fe2d6dbd1fa1bbac2cd66728c9065` |
| `tools/contracts/complain.ts` | `08b1f606d9cae01d4fe712e346ec175adf981077` |
| `tools/test-cross-project-kaizen.ts` | `bcff6853b7e09aae532b1e46c4772c3c03368e55` |

## Runtime Proof

- Invocation: `node tools/test-cross-project-kaizen.ts`
- Exit: `0`
- Terminal result: `19 cross-project Kaizen tests passed`
- Exercised result: the copied `session-env` advertised and executed `kaizen_report` and `kaizen_import_feedback`; inbox status read back both privacy-safe refs; the project contained no `docs/feedbacks` write. Direct import replay returned `deduplicated`, retained written `Status: open` only as evidence, stayed pending until an explicit `needs-investigation` decision, and rejected malformed/traversing entries.
- Disabled control: `OPENCODE_KAIZEN=0` exposed no feature, tools, or writes. The skill contract routes this absent-tool state to one bounded Markdown fallback.

## Validation

- `node tools/test-contracts.ts`: exit `0`, `OK: contracts tests=72`.
- `openspec validate add-cross-project-kaizen-loop --strict`: exit `0`, change valid.
- Instruction artifact review `ses_fb2c45993ffeqZRbghyp2Im1d7` (`xai/grok-4.6`) reported `CPL-001` and `CPL-002`; main reproduced both wording conflicts, corrected the candidate, and resumed the same reviewer. Corrected-candidate result: `no-material-finding` for the scoped routing surface.

## Claim Ceiling

This proves task 2.3 at the current provider-free copied-plugin, strict parser, store, and instruction-contract boundaries. It does not prove a cold model will follow the skill, installed skill restart/loading, complete `KZN-001`, current archive behavior after later source changes, complaint triage/proposal flow, or critical privacy/authorization qualification.
