# Task 1.3 Loaded Entry Proof

- Recorded at: `2026-08-25T20:36:25.9551148Z`
- Product Candidate: `b3bcf25f67bf7b9bf0f444362041571eee167bc85c058ca2e2d75d533fb1975d`
- Environment: `windows-node24.18.1-opencode1.18.23-loaded-r8`
- Runtime source: `implementation-evidence/task-1-3-loaded-r8/raw.json`
- Evaluation: `implementation-evidence/task-1-3-loaded-r8/evaluation.json` reports `status=complete` with every check true.
- Boundary: pinned OpenCode `1.18.23` owning binary, isolated `opencode serve`, one SDK-created root session and prompt, deterministic loopback provider, and exact owning-PID stop with listener-closed verification.
- Observed result: the copied `session-env` plugin loaded once, `chat.message` completed before system transformation, one selected procedure appeared exactly once in one bounded provider request, both project-memory tools and `session_delivery_context` were advertised, disposable Git status was preserved, and no trapped external egress occurred.
- Current support checks: `node tools/test-session-env-plugin.ts` passed `18/18`; `node tools/test-project-memory.ts` passed `4/4`; production and runner syntax checks passed.
- Privacy correction: the accepted R8 raw bundle was sanitized offline for JSON-escaped Windows fixture paths, and the runner now redacts that form. This did not rerun or change the R8 runtime oracle.
- Lifecycle note: the process status reflects the deliberate exact-PID stop; `serverTerminallyStopped=true` is the selected long-running-server lifecycle oracle.
- Cleanup: the proof-owned server stopped, its listener closed, and disposable state was removed. The unrelated host server on port `4096` was untouched.
- Maximum supported claim: pinned OpenCode loaded the copied plugin for one disposable root prompt and sent exactly one bounded advisory project-memory capsule to the loopback provider. `PMC-001` remains unknown outside this exact case.
