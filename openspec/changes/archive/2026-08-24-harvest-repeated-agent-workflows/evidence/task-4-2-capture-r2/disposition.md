# Harvest 4.2 Capture Disposition

- r1 harness (`proof/proof-model`) is not configured-provider evidence. Do not reuse it.
- r2 `--session-mode configured`: 6/6 samples, liveCalls=6, model `openai/gpt-5.6-sol`/`xhigh`, cleanup complete, validation/proof status 0.
- Provider-free replay vs accepted baseline: `blocked` `environment:scenarioDigest` (4.1 request changed the digest).
- Informal medians (not an evaluator pass): greeting tools 13 vs 12; openspec tools 23 vs 31; openspec failedToolCallCount 4 vs 1.
- `passed-improvement` is not supported. Task 4.2 stays unchecked.
- Unlock: same-digest baseline plus a candidate without failed-tool regression. Do not repeat r2 unchanged.
