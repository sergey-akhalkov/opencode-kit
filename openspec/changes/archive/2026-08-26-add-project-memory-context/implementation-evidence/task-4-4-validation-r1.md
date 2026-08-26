# Task 4.4 Current Validation R1

- Recorded at: `2026-08-25T23:07:54.1477143Z`.
- Product Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`.
- Runner: `98ca133f9b280b4c96661fc57f2a5d6e53a5334d629a2ada2ca4713535acfc6c`.
- Tests: `tools/test-project-memory.ts` `77cb93ef374e469a5022b8ffb793864ea6aa7f52d33f20f2425c2a0c4ef9df76`; `tools/test-project-memory-hooks.ts` `a98e27dcb9e385d1534d4643a22128b7de75fe3edccf9b564a06a1496220e3c8`.

## Commands

| Command | Status | Observed result |
| --- | ---: | --- |
| `npm run test:focused:project-memory && node tools/test-session-env-plugin.ts` | `0` | Direct project memory `9/9`, hook `1/1`, session plugin `18/18`. |
| `npm run proof:project-memory -- --evidence-dir .../task-4-4-package-r1` | `1` | Product/scoring/privacy/hook checks passed; `process-direct` and aggregate support failed because the reviewed seed expected the pre-SDET eight-test pass-name list. |
| Same package command with `task-4-4-package-r2` after adding the retained cross-project test name to the reviewed seed | `0` | Evaluation `status=complete`, `failed=[]`, all 22 member rows supported, cleanup complete. |
| `npm test` | `0` | Full configured serial repository test command completed without diagnostic fallback. |
| `npm run validate:strict` | `0` | `skills=31 agents=20 markdown=707 warnings=0 infos=2`; both infos are existing top-level OpenCode permission notices. |
| `npx openspec validate add-project-memory-context --strict` | `0` | Change is valid. |
| `git diff --check` | `0` | Only line-ending warnings on pre-existing shared-worktree files; no whitespace error. |

## Package Evidence

- Current seed file-bytes SHA-256: `f27774d45a678099ba47faab6a04cddbb5c6aeac34e5719d62fd58108c23da5d`; current parsed insertion-order canonical JSON SHA-256: `1cf5b0f0618d59304d1f62c8e14c83f29f8332d72b0d153e30e29d1670d99fd4`.
- Failed predecessor R1: evaluation `027ba9c4e2d3b5588bfbbeeee05fdc8e3d78f6d46766acd838be6aa83e17e681`; raw `39b7d29d27216eb4ec3def530f62cad719e7cc08963932f5283c06991676cd5d`.
- Selected R2: evaluation `5fa7967c9680fcaf8cf785a20b8f517deda5761117ab721a663e8da7b297413d`; raw `7ac40bb03441aa5cec35b9ffdf6b421edf033856e7423dbe46c924ff4a1bfd51`.
- Effects: provider-free disposable Git/data/Serena fixtures and proof-owned child processes only; package evaluation records no side effects and cleanup complete.
- Claim ceiling: the current package lane replaces the older corpus lane as current-runner evidence for the 22 named provider-free scenarios. `PMC-001` remains narrowed to each member's cited boundary; loaded R2 remains limited to its 25 checks.
