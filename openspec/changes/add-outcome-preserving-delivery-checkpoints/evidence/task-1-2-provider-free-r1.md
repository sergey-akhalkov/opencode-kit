# Task 1.2 Provider-Free Scenario Contract

- Candidate: `opdc-provider-free-r1`
- Environment: `windows-node-24.18.1-opencode-1.18.25-provider-free-r1`
- Result: complete
- Claim ceiling: provider-free structural proof only; no configured semantic behavior or `OPDC-001` population member is supported yet

## Real Boundary

`node tools/proofs/consumer-outcome-regression.ts --mode materialize --pack delivery-checkpoint --source-ref working-tree --candidate-id opdc-provider-free-r1 --evidence-root <change>/evidence/provider-free-r1`

- Exit: `0`
- Source digest: `63204b31834541af020eee81859119b2e83034249997e15fecfadfa673aeea9f`
- Evaluation digest: `37a1e7c8a2da1c3fb0e5d0c69720fb5d2667b69c50936e37cf026d880e0e0845`
- Population: `12` green rows passed and `12` deliberate red controls failed with their exact expected structural reason
- Effects: `0` provider, model, network, process, source-write, and remote calls/effects; two create-new evidence files
- Cleanup: terminal, zero sessions/processes/persistent temporary files

Provider-free replay used the preserved `bundle.json`, exited `0`, reproduced the same evaluation digest and 24 exact rows, and wrote `evidence/provider-free-replay-r1.json` only.

## Structural Contract

- Every reviewed semantic judgment (`checkpoint`, `continue`, `irreducible`, `suppress-duplicate`, or `owner-boundary`) is seed data outside helper code.
- The helper checks schema, bounds, exact anchors, checkpoint/question counts, next boundary, scope action, event order, and explicit `count * unitCost = expectedTotal` arithmetic.
- The helper does not use elapsed time, thresholds, similarity scores, dominance scores, quality scores, ranking, or semantic classification.
- The maximum arithmetic row is the reviewed `dominant-repeated-setup` case at `3 * 250 + 3 * 25 = 825` units; arithmetic does not select its disposition.

## Validation

- `node tools/run-focused-test.ts tools/test-consumer-outcome.ts`: `OK: consumer outcome tests=43`
- `--help` and `-h`: exit `0`, byte-identical, no evidence path created
- Preflight: `status=ready`, `memberCount=12`, `modelCalls=0`, `processCalls=0`, `providerCalls=0`
- Materialize/replay: exit `0`, stable repeated replay in focused tests, existing-root/stale-bundle/malformed-seed/overflow controls rejected
- Existing proof inventory: `package.json` retains `proof:consumer-outcome` -> `node tools/proofs/consumer-outcome-regression.ts`; `tools/proofs/README.md` already registers that owner and was not modified
- `git diff --check` over the pack, fixture, CLI, and focused test: exit `0` (line-ending warnings only)
- Serena diagnostics reported only the repository's existing missing Node type declarations (`node:*`, `process`, `Buffer`), including in pre-existing files; runtime-focused validation found no task-specific diagnostic failure
