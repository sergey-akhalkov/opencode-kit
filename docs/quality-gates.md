# Quality Gates

Quality gates make the Universal Development Loop executable and reviewable. They protect quality first while proportional scope, focused checks, autonomous defaults, and risk-driven breadth minimize time to a verified result.

The canonical loop definition lives at `instructions/universal-development-loop.md`; this document only describes the gate matrix and adapter commands that operate on top of it.

## Default Gates

| Gate | When | Evidence |
| --- | --- | --- |
| Focused validation | After each meaningful edit | Nearest test/build/lint command result |
| Happy-path proof | Behavior-changing code | Observable execution at the relevant user-facing or system boundary |
| Independent critical SDET | Material behavior, after MVP and accepted-scope completion | Fresh test-only SDET, reachable critical-risk matrix, smallest critical reproducer when needed, and mock confidence gaps |
| Code-quality reduction reviewer | Optional after MVP for concrete maintainability risk | Read-only safe net-reduction matrix or evidence-backed empty matrix |
| Test-coverage reviewer | Optional after MVP for concrete oracle risk | Requirement-to-test risk matrix and meaningful oracle gaps |
| Implementation-readiness reviewer | Risky plans/specs or blocked requirements | Scope, decisions, blockers, validation path |
| Final validation | Boundary/API/data/deployment/compatibility change | Broader project command result |

Ordinary Small uses main-owned Runtime Proof, focused validation, and realistic requirement-linked edge inspection. It does not acquire independent SDET or systematic reviewer gates solely because behavior changed.

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
