# Tasks 2.1-2.3 Runtime Proof

- Candidate: `p0-preflight-r9`.
- Product Candidate: `global/bin/roadmap-mission.ts`, `global/bin/roadmap-mission/contracts.ts`, and `global/bin/roadmap-mission/preflight.ts` with hashes recorded in `p0-preflight-r9/raw.json`.
- Proof Runner: `tools/proofs/roadmap-mission.ts` provider-free preflight mode.
- Evaluator: structural scenario assertions plus complete before/after project manifest digests.
- Environment: Windows, Node `v24.18.0`, real Git, OpenCode debug loader, and fake OpenSpec `1.6.0` boundary in disposable generic projects.
- Invocation: `npm run proof:roadmap-mission -- --mode preflight --evidence-root <change>/evidence/p0-preflight-r9 --candidate-id p0-preflight-r9`.
- Result: exit 0; evaluation `complete`; cleanup `complete`; project mutation count 0.
- Happy path: valid two-slice disposable mission returned exactly `slice-a` eligible and all 14 definition/project/workflow checks passed, including actual loaded skill/command identity.
- Fail-closed scenarios: forward dependency, invalid persistent evidence-only checkpoint, missing adapter, ambiguous active changes, dirty owned path, stale project workflow overlay, and next-slice protected effect all blocked at their owning check.
- Side effects: disposable generic projects and copied global source only; no provider, credential, remote, install, activation, target project, or protected effect.
- Architecture: thin CLI 107 lines, schema/contracts 393 lines, preflight 432 lines; no new production split-candidate. `preflight.ts` is an attention-band cohesive runtime-inspection owner.
- Validation: all production/proof syntax checks exit 0; `npm run validate` exit 0 with warnings 0; `git diff --check` exit 0.
- Raw Evidence Bundle: `evidence/p0-preflight-r9/raw.json` and `evaluation.json`.
