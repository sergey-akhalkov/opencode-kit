# Exact-Practice-Owner Candidate Live Gate R2

- Lane: `bounded-falsification-review-v1/exact-practice-owner`; Live-Attempt Gate: clear for one causally distinct r2 capture, consumed at start.
- Identity: governed source `d6d7dcfba687a51f38b5df249de4a32e1be1ba11379cd6f7c9629d17ec8cb80f`; scenario `7b347280fdcbf83c6b9228cb2efc66cfde1f1b67872a6feb6456ecf15220a7ea`; request `82a0f97b666beae5fd0151780e0ca5625fa29936416b4fa86eb44fd6aaf4191d`; source fixture `05b0f29dc51db2618b6c68883d64e7e1e78542c85bc74f648a3d79ebe4e429fe`; OpenCode `1.18.23`.
- Failure/replay: r1 is failed-finalized with `timedOut=true`, `ETIMEDOUT`, elapsed `300217`/`300000` ms, one completed readiness child, no failed tool, no record, terminal process cleanup, and aggregate zero-call replay `03bd720a719d54a7c94039526949efb240280e6ba7d47a76330fd254f1dc0b15`.
- Dependency-invalidating runner: `capture.ts=aae11239d8b8c1c693c1d70713d4aa5dc0d4bf71179ff6af0a6a154896c51f38`; `test-consumer-outcome.ts=ba71db0787460a3ed2312edc57ffdadd7a879704b38aa59ffafec99c01f4a6c8`. The existing 420-second bound now applies to this exact explicitly two-owner member; all request, fixture, model/profile, permissions, owner separation, checker, and evaluator semantics remain unchanged.
- Offline: consumer-outcome tests 33 distinguish timeout and assert this member's long-session bound; selected preflight ready with zero model calls.
- Required observation: one readiness child plus one independent `instruction-artifact-reviewer`, no fan-out/impersonation, exact terminal row, status/proof/validation zero, `timedOut=false`, elapsed below 420000 ms, and complete cleanup.
- Retry condition: any successor requires another dependency-invalidating change, terminal replay, and new gate. Historical comparison remains non-matched.
