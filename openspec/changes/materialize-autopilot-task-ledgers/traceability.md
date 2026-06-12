# Traceability: Materialize Autopilot Task Ledgers

| Requirement | Design Source | Task Coverage | Validation Evidence |
| --- | --- | --- | --- |
| Explicit starts materialize selected changes | Trigger Model; Preflight; Publication Algorithm | Plan And Contract; Ledger Builder; Plugin-Owned Publication; Runtime Integration | `npm test`; focused materialization tests; `npm run autopilot:validate -- <materialized-ledger-fixture>` |
| Read-only paths stay read-only | Trigger Model; Interaction With Existing Flows | Plan And Contract; Runtime Integration | Read-only safety tests; trigger policy tests; instruction-drift tests |
| Generated ledgers are valid before publication | Ledger Shape; Publication Algorithm | Ledger Builder; Plugin-Owned Publication | `validateTaskLedger` unit tests; fixture validation; `npm run validate` |
| Materialization output is machine-readable | Output Contract | Plan And Contract; Runtime Integration; Documentation And Instructions | Output contract tests; README/skill drift tests |
| Plain `/autopilot` does not require `<change-id>` | Trigger Model; Preflight; Risks | Plan And Contract; Runtime Integration | Unscoped selected-primary tests; prompt-resolved start tests |
| Documentation explains who creates `task.json` | Design Principles; Rollout | Documentation And Instructions | `instruction-artifact-reviewer`; instruction-drift tests |
