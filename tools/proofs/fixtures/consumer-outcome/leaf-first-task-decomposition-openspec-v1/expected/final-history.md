# Strategy History

## 2026-09-01 - Isolate schema input prerequisite

- Observed: schema execution exposed an independently testable input-materialization prerequisite.
- Superseded route: retry schema and parent integration together.
- Selected Route: prove `leaf-schema-prerequisite`, then resume `leaf-schema`; preserve `evidence-transport`.
- Retry Condition: the schema prerequisite oracle passes.
