# Delegation Brief Workflow

Use this disposable workflow before reducing always-loaded delegation instructions. Do not build a code harness.

## Synthetic Task

Delegate a production-only fix to a cold-context implementation worker:

- Goal: make the local config loader honor `OPENCODE_CONFIG_DIR` and expose the loaded marker through the existing CLI.
- Observed: representative CLI invocation ignores the alternate directory; `src/config.ts:42` reads only the default home.
- Unknown: whether callers cache the resolved directory.
- Scope: read `src/config.ts` and nearest caller; write only `src/config.ts`.
- Forbidden: tests, docs, dependencies, network, credentials, commits, remote actions, unrelated files.
- Required behavior: alternate directory wins when set; default behavior remains unchanged when unset; preserve original error cause.
- Acceptance proof: invoke the CLI twice against disposable config directories and observe alternate/default markers.
- Focused validation: `npm test -- config`, exit `0`.
- Return: changed paths, raw proof/validation outcomes, blocker or residual risk.

## Quality Oracles

Both variants pass only when the resulting cold-context brief contains:

1. Role and outcome/value objective.
2. Observed evidence separated from the cache hypothesis/unknown.
3. Explicit read, write, in-scope, out-of-scope, and forbidden boundaries.
4. Required alternate/default/error behavior.
5. Exact acceptance proof and focused validation success condition.
6. Return contract and user-owned blocker policy.
7. No invented API, file, test ownership, or user decision.

Compare the current full contract with a compact contract carrying the same information. Keep the compact form only when all oracles pass and its instruction/output surface is smaller.

## 2026-08-08 Observation

- Model/environment: `xai/grok-4.5`, `high`, isolated pure OpenCode runs with the same synthetic task.
- Baseline current contract: exit `0`, `50660 ms`, `8393` output characters.
- Compact candidate: exit `0`, `13999 ms`, `2313` output characters.
- Quality: both passed all seven oracles; the compact candidate preserved the cache unknown and every execution/proof boundary without requiring the worker to reconstruct context.
- Decision: keep the compact contract. One pair is evidence for this instruction reduction, not a general speed claim.
