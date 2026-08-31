# Task 4.2 Configured Grind Evidence

- Candidate: `opdc-configured-grind-r2`
- Installed OpenCode: `1.18.25`, executable SHA-256 `59b379b53354da72d2c5262119fe70c44b4e473826ebbaa94d47a2d58a359b1a`
- Routes: primary `openai/gpt-5.6-sol/xhigh`; hidden arbiter `xai/grok-4.6/high`
- Boundary: isolated configured OpenCode server and disposable root, followed by provider-free capture and suite replay
- External/protected effects: none

## Observed Behavior

- The installed permission boundary connected Nuphus but sent zero tools in the hidden arbiter provider request; every normal agent retained enabled tools.
- The primary completed the independent sibling, selected the bounded checkpoint canary, recorded its oracle, and wrote frontier generations `0` through `3` in order.
- The hidden arbiter returned one correlated `continue` at frontier generation `3`, selecting only `item_costly`, then one correlated `allow_stop` after frontier generation `4` completed every item.
- The costly item remained pending through the satisfied checkpoint generation and became complete only in the post-continuation generation.
- `questionCalls=0`; external, protected, and question effect counts are zero; final frontier state and guard state are `complete` and `passed`.
- The suite-owned root, children, fixture, and server reached terminal cleanup. The pre-existing user OpenCode process set was unchanged.

## Oracle Recovery

- The configured capture initially failed only because the proof runner required a redundant free-text marker after the authoritative continuation and before the fourth frontier call.
- The provider-free evaluator retained the exact four-generation trace, continuation correlation, two error-free arbiter verdicts, effect counts, and cleanup oracles while removing only that redundant marker requirement.
- The corrected capture replay reports `candidateOraclePass=true`, `cleanupOraclePass=true`, `evaluatorRecovered=true`, and `replayComplete=true`.
- The corrected outer suite replay reports `captureReplayComplete=true`, `cleanupComplete=true`, `observationsComplete=true`, `suiteFinalizationComplete=true`, and `modelCalls=0`.

## Artifact Hashes

- `configured-grind-permissions-r2/evaluation.json`: `b15f67701ab74c6a9e41801855fb84d0159d102119d88258f2b86740f32a32bd`
- `configured-grind-preflight-r5/preflight.json`: `20d9d9b242540cbe8a283dda2c638ae1f87dd44569aef800023cfb326aa9e7a3`
- `configured-grind-r2/raw.json`: `90ccdec9a925da488444d92c71becadaf59f47c59f3dfde39e07d45dc0af4970`
- `configured-grind-r2/capture-delivery-checkpoint/raw.json`: `5146284205cb317c2488b9e1ab8951af0d85a2fcb618faa3f2a7f0d3532baf29`
- `configured-grind-r2-replay-r2/evaluation.json`: `736d637a7a24db6557c7d20a6685c890a5c6c0949858fce435bc616d9a1d6cd7`
- `configured-grind-suite-replay-r2/evaluation.json`: `1301e69adeea3ee9a9d8bf5eb5070fe92725c5303402ee31455e592f76cb1e27`

## Claim Ceiling

This completes the exact configured grind requirement in task `4.2`. It does not by itself support any `OPDC-001` population member, project-neutral trigger quality, or current configured ordinary/OpenSpec behavior after the task `4.1` source mutation.
