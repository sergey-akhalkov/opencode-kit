# Task 2.1 Immutable Baseline

- Outcome: baseline established from `task-2-1-baseline-r9/bundle.json`; no instruction source was modified before capture.
- Identity: source `87f0575bd28bb01de4ca89ab7602c67c7fea9be576736441e1b5c831ce6315fc`, scenario `64454936f0a923bc11baa5fe94823aaff6ac4833d813fbd05a82d496d0dfd99c`, installed OpenCode executable `f831518278ded5090c41cc532b16ab80629e980f710a0b46d1e5b605808bb1d9`.
- Routes: main `openai/gpt-5.6-sol/xhigh`; configured compaction `xai/grok-4.6/high`.
- Configured boundary: exactly three requests, one main prompt, one actual `session.summarize`, and one reconstruction prompt. No tool calls, owner questions, remote mutation, or foreign source mutation occurred.
- Main observation: all three CSA-001 members retained all seven expected status fields exactly.
- Compaction/reconstruction observation: compaction was accepted, but reconstruction changed `known-resource-path-unknown.resourceAvailability` from `available` to unsupported `known` and returned null for multiple independent authority, readiness, evidence, consequence, outcome, and resource fields. The terminal baseline verdict is intentionally `failed`; it records pre-change status loss and makes no improvement claim.
- Cleanup: session, fixture, and exact proof process were removed; cleanup is complete with no recorded error.
- Provider-free terminal replay: two runs returned `liveCalls=0` and the same outer digest `ffed2d62bc027bd951bf0a796fb6616683afe15dec2c74857be41a2cb8ed401c` (evaluation digest `b9beef4e460579899875f08eca2192d1b32aacbe5932213ec024600a90a8bea0`).
- Claim ceiling: these observations cover only the three reviewed status-scope members, recorded source/model/routes, prompt bytes, fixture, OpenCode executable, operating-system class, and environment.
