# Candidate Runtime R5 Failure

- **Candidate:** `candidate-runtime-r5`
- **Command:** `npm run proof:guard-restart -- --scenario retention --candidate-id candidate-runtime-r5 --evidence-root <change>/evidence/candidate-runtime-r5`
- **Boundary:** Full isolated installed OpenCode retention/restart runner after R4 offline replay.
- **Exit:** `1` from the supervising process after its 120000 ms terminal limit.
- **Observed Stages:** `retention-server-1-ready`, then `retention-server-2-ready`; no later stage or worker-published bundle.
- **Supervisor Cleanup:** The worker was terminated, its recorded OpenCode server PID was force-terminated if present, and the fixture directory was removed. Post-run checks found no fixture directory, no evidence directory, and no remaining process other than the diagnostic PowerShell queries themselves.
- **Missing Observation:** The old runner wrapped loop deadlines around unbounded SDK requests, had no stage after recovery wait, and published no failure bundle. Therefore the preserved output cannot distinguish a hung status read, child read, graceful stop, or cleanup request.
- **Terminal Result:** Product state is unknown for R5; R4 remains the latest passed recovery boundary and repeat-restart proof is still missing. Candidate remains `development`.
- **Unlock Condition:** Add bounded SDK requests, forced server-stop fallback, fine-grained recovery/verification stages, and failure-bundle publication. Exercise only provider-free help/component/offline checks before one bounded diagnostic capture; another full proof is not yet authorized by R5 evidence.
