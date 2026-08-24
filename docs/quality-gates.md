# Quality Gates

Quality gates make the Universal Development Loop executable and reviewable. They preserve honest quality while the shortest verified path, autonomous defaults, token-efficient evidence, and continuous improvement minimize time to the accepted result. A concrete obstructive gate is fixed, narrowed, or removed at the smallest authorized layer, never bypassed by weakening safety or proof.

The canonical loop definition lives at `instructions/universal-development-loop.md`; this document only describes the gate matrix and adapter commands that operate on top of it.

## Default Gates

| Gate | When | Evidence |
| --- | --- | --- |
| Focused validation | After each meaningful edit | Nearest test/build/lint command result |
| First sufficient real signal | Each behavior dependency chain, before dependent expansion | Current rung, first safely reachable real boundary sufficient for the accepted effect, or a path-scoped blocker/unblocker or goal-preserving replan plus authorization, safeguards, restoration, and evidence plan |
| Happy-path proof | Behavior-changing code | Observable execution at the relevant user-facing or system boundary |
| Project doctor | After bootstrap and before lifecycle automation | `npm run doctor -- --project <path> --require structural|qualification|unattended`; exit `0` and an empty selected blocker array |
| Independent critical SDET | Reachable named critical consequence or explicit requirement, after proof and accepted-scope completion | Fresh test-only SDET, reachable critical-risk matrix, smallest critical reproducer when needed, and mock confidence gaps |
| Code-quality reduction reviewer | Optional after current proof for concrete maintainability risk | Read-only safe net-reduction matrix or evidence-backed empty matrix |
| Test-coverage reviewer | Optional after current proof for concrete oracle risk | Requirement-to-test risk matrix and meaningful oracle gaps |
| Implementation-readiness reviewer | Risky plans/specs or blocked requirements | Scope, decisions, blockers, validation path |
| Final validation | Boundary/API/data/deployment/compatibility change | Broader project command result |

Ordinary Small uses main-owned Runtime Proof, focused validation, and realistic requirement-linked edge inspection. It does not acquire independent SDET or systematic reviewer gates solely because behavior changed.

Shift-left changes evidence order, not authority: local preparation may proceed, but remote, shared, credentialed, costly, destructive, or physical execution remains separately owner-controlled and subject to restoration, cleanup, and live-attempt gates.

Doctor automation must use an explicit `--require` gate. Exit `2` means the selected gate is blocked; exit `1` is reserved for invalid arguments or diagnostic failure. The no-selector command remains informational and can exit `0` while qualification is blocked, so it is not a qualification gate. Canonical OpenSpec workflow collisions fail closed for qualification and unattended modes; additive config or instruction layers remain diagnostic unless another requirement makes them authoritative.

## Adapter Commands

Store project commands in `opencode-dev-kit/adapter.json` or project docs:

```json
{
  "validation": {
    "focusedTest": "unknown",
    "test": "unknown",
    "typecheck": "unknown",
    "lint": "unknown",
    "build": "unknown"
  }
}
```

Use `unknown` when a command cannot be determined from local evidence. Do not invent commands.
