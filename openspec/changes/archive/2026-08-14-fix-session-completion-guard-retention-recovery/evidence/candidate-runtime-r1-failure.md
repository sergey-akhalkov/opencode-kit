# Candidate Runtime R1 Failure

- **Candidate:** `candidate-working-retention-r1`
- **Command:** `npm run proof:guard-restart -- --scenario retention --candidate-id candidate-working-retention-r1 --evidence-root <change>/evidence/candidate-runtime-r1`
- **Boundary:** Fresh installed `opencode serve`, loaded production guard, isolated config/data/cache/state/project roots, local effect-free provider simulator.
- **Exit:** `1`
- **Observed:** Server 1 seeded two guard-owned child sessions and stopped. Server 2 loaded the candidate and reached root state `error` before any provider request.
- **Owning Error:** `Retained completion arbiter child limit reached with no eligible terminal child` from `arbiter-child.ts:140`.
- **Provider Facts:** `arbiterCalls=0`, `primaryCalls=0`, `requestKinds=[]`.
- **Cleanup:** Worker reported `cleanup-complete`; proof-owned sessions, processes, simulator, and fixture root were removed. No evidence root was published by the runner.
- **Missing Observation:** The seed created never-prompted child records, so the failed capture did not preserve whether the real status API represented them as explicit `idle` or absent/unknown.
- **Terminal Result:** Product runtime proof failed; candidate remains `development`.
- **Unlock Condition:** Seed children through completed local simulator prompts, assert `session.status[id].type === idle` before restart, retain their guard metadata as `auditing`, and rerun under a new immutable evidence root. This changes the causal fixture mechanism to match the actual interrupted children, which both had provider executions.
