# Task 1.3 Unchanged Baseline

- Accepted bundle: `baseline-sessions/foundation-integrity-baseline-r2/bundle.json`
- Capture mode: configured baseline, seven primary calls, profile `quality-independent`
- Evaluator status: `baseline-established`
- Capture evaluation digest: `b334a62e757a660b946504725ede62bcd2d05d64663a9a14d9944c1e71aaeb9a`
- Terminal decision digest: `18b63ec4d4ebffcba36c629810011e5810812dea74dd0632f79e65577ee96910`
- Scenario digest: `3e20233bebd90640a03ff734a5d10f2e44be0694938924f439b828d276cf8129`
- Source digest: `98c9db0db053ee2f072ee93084fcdece0d85d49138e935e465cbe6b251713468`
- Environment digest: `eaddfa044006c2f4c0032929e1d6b31118d84ff3e387b4a57905a21ce9c98d15`
- Baseline observations: seven complete scenario oracles and twelve explicit terminal rows, all `unknown`; `ownerAgent: none`; `recoverySkillCount: 0`; no corrected-candidate review.
- Effects: all tracked fixture, archive, and unrelated hashes unchanged; cleanup complete; every session deletion status zero; no consumer, credential, install, remote, destructive, or protected effect.
- Provider-free sealing: `terminal-replay-1.json` and `terminal-replay-2.json` each reported `baseline-established`, the same evaluation and terminal digests, twelve passing rows, and `liveCalls: 0`.
- Superseded failed evidence remains immutable under `foundation-integrity-baseline-r1/`; its terminal replay identified the malformed fallback observation and did not support this task.
- Live-Attempt Gate: clear for the accepted task-1.3 baseline lane only.

Maximum claim: the unchanged loaded source lacks the represented owner/recovery behavior for the seven reviewed scenarios under the captured model, profile, environment, fixture, and evaluator identities. It does not generalize to another provider, model, project, or mismatch class.
