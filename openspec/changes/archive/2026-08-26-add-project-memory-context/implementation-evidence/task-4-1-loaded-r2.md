# Task 4.1 Current Loaded Boundary R2

- Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`.
- Runner: `98ca133f9b280b4c96661fc57f2a5d6e53a5334d629a2ada2ca4713535acfc6c`.
- Environment: `windows-node24.18.1-opencode1.18.23-pmc-loaded-r2`.
- Runtime identity: owning OpenCode `1.18.23` SHA-256 `f831518278ded5090c41cc532b16ab80629e980f710a0b46d1e5b605808bb1d9`; copied plugin runtime `1.18.23`; ripgrep SHA-256 `50724f5aa5124be1db2dad4038d154ce8fbbaeb8f38aa761c606faa0d3e9d902`.
- Preflight: `task-4-1-config-preflight-r2` completed both no-model config phases with zero provider requests, zero trapped egress, and unchanged disposable Git status.
- Invocation: `node tools/proofs/project-memory-context.ts --mode loaded --opencode <owning-opencode> --expected-version 1.18.23 --plugin-runtime <copied-runtime> --ripgrep <pinned-ripgrep> --evidence-dir openspec/changes/add-project-memory-context/implementation-evidence/task-4-1-loaded-r2`; exit `0`.
- Pre-cleanup capture: `capture.json` SHA-256 `ab4558c433dde28d690edde495f4b93345ef5f694fd2356eec87c7b44d835045`, written after all oracle inputs and before session, server, provider, and fixture cleanup.
- Terminal raw: `raw.json` SHA-256 `7c21107f539b5d6073e25cc2c7002c2735aa5f609a77e7d2da8629b6cd8bb253`.
- Evaluation: `evaluation.json` SHA-256 `3ba83f764547bde2358b7a936264c95270030aafb8b379ad8197f5cb2dad60ab`; `status=complete`, `failed=[]`, all 25 checks true.
- Observed boundary: 21 bounded loopback-provider requests, maximum captured request text 24,144 bytes, explicit candidate/promote/recall/invalidate lifecycle, relevant and irrelevant automatic recall, root/subagent separation, root-timeout fail-closed behavior, system and compaction revalidation after second-process invalidation, active/stale/fingerprint states, curated Serena, malformed and over-limit behavior, and one advisory capsule on the relevant root request.
- Safety and cleanup: trapped external egress `0`; project-root and credential probes absent from all three JSON artifacts; disposable Git status unchanged; exact proof port `63196` had zero listeners after controlled exact-PID stop; the two pre-existing temp roots predated the run and no new fixture root remained.
- Claim ceiling: current-candidate loaded evidence supports the reviewed R2 scenarios only. Complete `PMC-001` partitioned-population closure remains `unknown` until the required fresh SDET, candidate freeze, observation binding, and independent evidence-sufficiency challenge are complete.
