# Task 1.4 Unchanged-Source Team-Advising Baseline

## Scope

- Candidate id: `add-specialist-team-advisor-baseline-r2`
- Arm: `baseline`
- Source ref: `working-tree`
- Governed source digest: `9dd99ba58b93e83a090c4b70ff706dd62d8e59fa286f8184b9d113c1b880f1b5`
- Pack digest: `7cad8bec084c94337d529729ff88cea995d8b2e65558d4649a8a725bd79390bc`
- OpenCode: `1.18.25`, executable SHA-256 `59b379b53354da72d2c5262119fe70c44b4e473826ebbaa94d47a2d58a359b1a`
- Profile/model: `quality-independent`, `openai/gpt-5.6-sol`, `xhigh`
- Active runtime surface: generated `core`

## Governed Invocation

```text
npm.cmd run proof:consumer-outcome -- --mode baseline --pack team-advising --candidate-id add-specialist-team-advisor-baseline-r2 --evidence-root <repo-home>/opencode-kit/openspec/changes/add-specialist-team-advisor/evidence/team-advising-baseline-r2 --source-ref working-tree --session-mode configured --opencode <private-home>/.bun/bin/opencode.exe
```

Result: exit `0`, ten configured root turns, all nine baseline rows passed.

## Privacy-Derived Preserved Evidence

- Current privacy-derived bundle: `evidence/team-advising-baseline-r2-privacy-redacted-r1/bundle.json`
- Conversion evaluation: `evidence/team-advising-baseline-r2-privacy-redacted-r1/evaluation.json`
- Source bundle digest retained as provenance: `154cf9e49b72ca18e835e8a3b6c34ecf654c9276244b57fc87f082d1bc4c0665`
- Current bundle digest: `be238f7c1d893800605250c49fbeed0b7c885d27143ca32171c94590fd7373a3`
- Current evaluation digest: `97fff01eacc29a8a51e6a3d9acf216d96467463d0d13292305b3be540790fcd2`

For every population member, the configured root command and representative fixture proof exited `0`, expected disposable changed paths matched, governed source remained unchanged, no forbidden effect was observed, and cleanup reported zero sessions plus removed fixture/process state. Baseline advisor and catalog call counts were both zero. Existing direct Practice Owner or worker routes remained attributable where the loaded instructions required them.

## Failure And Recovery Chain

The first baseline stopped after one configured request and preserved `evidence/team-advising-baseline-r1/bundle.json`. It failed before prompt execution because the hand-built proof environment disabled OpenCode's internal provider plugins. `replay-r1.json` and `replay-after-runner-fix-r1.json` reached the same terminal blocked result with zero live calls.

`evidence/team-advising-baseline-diagnostic-r1/bundle.json` retained debug logs proving `ProviderModelNotFoundError`; its `replay-r1.json` is terminal. The runner then reused `configuredProofServerEnvironment`, preserving internal providers while suppressing external skills/config and isolating cache/database/state.

The second diagnostic proved the corrected configured turn, exact result contract, representative proof, expected effects, and unchanged source. Its cleanup field was a runner-observer false negative: OpenCode 1.18.25 returns status `0` with empty stdout for an empty isolated session database. Provider-free preflight reproduced that exact behavior; the corrected parser accepts only empty-success or a valid JSON array and reports `cleanupObserverReady=true`.

Task 5.1 later proved that the original raw baseline and historical diagnostic bundles retained JSON-escaped private paths. Those unsafe raw files were removed. The deterministic converter verified the original sealed digest, redacted only private-home prefixes, resealed every sample with source-bundle provenance, and replayed all nine rows with `liveCalls=0`. The privacy-derived baseline is current only at that narrower evidence ceiling.

No failed baseline or diagnostic invocation was reused as proof, and no unchanged failed invocation was repeated without a causally different proof-environment or observer correction.

## Claim Ceiling

This evidence establishes the unchanged-source baseline for the nine reviewed `STA-001` scenarios under the recorded OpenCode/model/profile/source environment. It does not establish candidate behavior, universal routing correctness, cross-model equivalence, active-host installation, or deployed behavior.
