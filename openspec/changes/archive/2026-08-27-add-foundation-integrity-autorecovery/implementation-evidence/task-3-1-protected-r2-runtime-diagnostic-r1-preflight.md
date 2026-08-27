# Protected R2 Runtime Diagnostic R1 Preflight

- Purpose: classify why the keyed protected-ambiguity CLI capture stopped after main reproduction and before the decision write. This server/SDK invocation is diagnostic-only and cannot satisfy task 3.1 acceptance.
- Candidate governed digest: `87fe04ff093f71acd8ddd2c65dcec91021289808ecfeac9d6b5bfa591ff7ea14`; scenario digest `69839d9cf4dbaed7d7a26417117d4d9e1abaa301a9b1f54c8fd42b0419092a62`.
- Scope: one selected protected scenario, one configured primary prompt, no baseline call and no other scenario.
- Instrumentation: configured route/provider readiness, structured assistant/tool/error readback, 300-second bound, process-tree stop, redacted logs, XDG hashes, decision/proof state, session/process/fixture cleanup.
- Stop line: stop after first structured completion, provider/runtime error, process exit, or timeout; seal `diagnostic.json`; do not repeat unchanged CLI capture or infer acceptance.
