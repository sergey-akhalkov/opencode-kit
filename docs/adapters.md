# Technology Adapters

Adapters capture project-specific commands and constraints while preserving one Universal Development Loop.

## Adapter Responsibilities

- Name test, typecheck, lint, build, and focused validation commands.
- Record command confidence as confirmed, docs-only, unknown, or blocked in project docs when useful.
- Document environment prerequisites that affect validation.
- Keep domain constraints close to the project, not in global instructions.

## Adapter Non-Responsibilities

- Do not define a new workflow.
- Do not override the active working philosophy, evidence-first proof, proportional Ordinary Small validation, or qualification-scoped RC and named-risk critical SDET rules. Fix, narrow, or remove adapter friction only at the smallest authorized layer without weakening safety or accepted behavior.
- Do not make global skills project-specific.

## Minimal Adapter

```json
{
  "schemaVersion": 1,
  "validation": {
    "focusedTest": "unknown",
    "test": "unknown",
    "typecheck": "unknown",
    "lint": "unknown",
    "build": "unknown"
  }
}
```
