# Task 5.1 Execution-Safety Practice Observation

- Practice: `execution-safety`
- Observation: `findings-reported`
- Reviewer task: `ses_fb502b874ffe1xAUyOppZ56bS1`
- Inspected candidate: `add-specialist-team-advisor-task-4-3-full-r5`
- Inspected governed source: `1fb07c7ab923a3626cbc7ea7656bbb40f493ad555fb6d66d2d03149bdb7c7702`
- Effective Model: `xai/grok-4.6`
- Role boundary: read-only; no mutation, dispatch, provider call, or lifecycle verdict

| Risk ID | Current evidence | Consequence | Smallest mitigation |
|---|---|---|---|
| `ES-STA-PRIV-001` | r5 command stdout retained JSON-escaped private home/temp paths; team evaluation did not run the common private-path oracle. | Shareable evidence disclosed host identity/path data and could pass its privacy claim incorrectly. | Redact exact and generic escaped private-home forms, assert privacy before sealing, and fail replay on unsafe legacy samples. |
| `ES-STA-ORCL-001` | All six forbidden-effect rows were hardcoded `{ observed: false }`. | The evaluator treated unobserved absence as proof of the protected-effect envelope. | Derive rows from tool command/path sentinels and a target-worktree status digest; require candidate rows to name their oracle. |
| `ES-STA-PERM-001` | Product plugin attribution failed closed and r5 showed catalog calls only from advisor children, but the denial control used direct plugin execution plus permission readback rather than an actual non-advisor session tool call. | Engine-level denial remains independently unproven if plugin attribution were later removed. | Keep plugin attribution as the enforced gate and challenge actual non-advisor callers in task 5.2 SDET. |

No current product leak was found in catalog entry sanitization, hidden/control/self omission, wildcard-then-exact permission order, or advisor mutation/dispatch authority. The critical authorization/privacy challenge remained assigned to task 5.2.
