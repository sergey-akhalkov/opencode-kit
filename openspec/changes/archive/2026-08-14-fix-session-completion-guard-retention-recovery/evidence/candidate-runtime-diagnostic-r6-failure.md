# Candidate Runtime Diagnostic R6 Failure

- **Candidate:** `candidate-runtime-diagnostic-r6`
- **Command:** `npm run proof:guard-restart -- --scenario retention-recovery --candidate-id candidate-runtime-diagnostic-r6 --evidence-root <change>/evidence/candidate-runtime-diagnostic-r6`
- **Intent:** Bounded diagnostic capture of only the first loaded recovery, not full repeat-restart proof.
- **Exit:** `1` from the supervising process after 120000 ms.
- **Observed Stages:** None. The worker did not reach `retention-server-1-ready`, so no product seed or recovery mutation occurred.
- **Localization:** `startOpenCode` performs server readiness through a direct unbounded SDK request before emitting the first stage. This request was not covered by the R5 timeout correction.
- **Supervisor Cleanup:** Post-run checks prove no fixture directory, no evidence directory, and no remaining non-diagnostic process correlated with the candidate id.
- **Terminal Result:** No product evidence was acquired. Runtime proof remains blocked; candidate remains `development`.
- **Unlock Condition:** Bound each readiness request, force-stop the server on readiness deadline, preserve startup stderr through the existing run catch, then validate the changed runner through help/static checks before another local process capture.
