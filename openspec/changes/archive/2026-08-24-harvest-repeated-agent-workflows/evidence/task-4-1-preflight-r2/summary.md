# Harvest 4.1 Preflight

- Two scenarios: `ordinary-small-greeting`, `openspec-add-json-output`.
- OpenSpec request now requires one `repo-candidate-snapshot --summary` inspection. Outcome/safety/cleanup fields unchanged.
- Candidate request: `task-4-1-candidate-request.json` expectation `improvement`, sourceRoot `.`.
- Preflight `--source-ref working-tree`: status ready, modelCalls 0, scenarioDigest `e2c480df7f12a860f0b389624efe50296adb2cf067690afac37d2cc43f310910`.
- Gate: blocked `stale-evaluator` (pre-existing). Comparison identities present: sourceDigest, scenarioDigest, environmentDigest.
- `node tools/run-focused-test.ts tools/test-consumer-outcome.ts` OK tests=15.
