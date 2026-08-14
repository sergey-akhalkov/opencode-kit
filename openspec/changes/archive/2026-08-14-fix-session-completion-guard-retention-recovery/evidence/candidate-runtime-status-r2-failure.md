# Candidate Runtime Status R2 Failure

- **Candidate:** `candidate-working-status-r2`
- **Command:** `npm run proof:guard-restart -- --scenario retention-preflight --candidate-id candidate-working-status-r2 --evidence-root <change>/evidence/candidate-runtime-status-r2`
- **Boundary:** Fresh installed `opencode serve`, two guard-owned children each completed through the local effect-free provider simulator, no root enablement or retention mutation.
- **Exit:** `1`
- **Observed:** Both child prompts completed; simulator facts were `primaryCalls=2`, `arbiterCalls=0`, `requestKinds=[primary,primary]`. `session.status` omitted both completed child ids, producing captured types `unknown,unknown` under the old evaluator assumption.
- **Runtime Source Correlation:** OpenCode `v1.18.18` source `packages/opencode/src/session/status.ts` stores only non-idle statuses in the list map: `set(... idle)` deletes the session id, while `get(sessionID)` maps absence to `{type: idle}`. The installed SDK prose saying the list includes idle sessions does not match this implementation.
- **Cleanup:** Worker reported `cleanup-complete`; proof-owned sessions, process, simulator, and fixture root were removed. No evidence root was published by the runner.
- **Terminal Result:** The explicit-entry idle assumption is disproved. Product runtime proof remains failed and the candidate remains `development`.
- **Unlock Condition:** Treat a successfully re-fetched existing child that is absent from the active status map as the runtime's canonical idle representation, retain timeout-plus-settle age and exact ownership/current-epoch checks, model an unreadable status request as unknown/fail-closed, then replay component and loaded-runtime lanes under new evidence roots.
