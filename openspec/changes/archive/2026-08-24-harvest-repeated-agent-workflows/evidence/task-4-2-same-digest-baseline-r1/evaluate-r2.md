# Official same-digest evaluate of r2

- Baseline: `task-4-2-same-digest-baseline-r1` status `baseline-established`, scenarioDigest `e2c480df…`, liveCalls 6.
- Candidate: preserved `task-4-2-capture-r2` (not recaptured).
- Replay and evaluate `--expectation improvement`: status `failed`.
- Reasons: `friction-regression:ordinary-small-greeting:totalToolCallCount:11:13`, `friction-regression:openspec-add-json-output:failedToolCallCount:1:4`.
- Digest `8c2aed7485b5969884a7aff898e255b1b77728cbaf9c10a50526ad49569676bf`.
- Task 4.2 stays unchecked. Do not repeat r2. A later candidate mutation that reduces those two friction fields is the unlock.
