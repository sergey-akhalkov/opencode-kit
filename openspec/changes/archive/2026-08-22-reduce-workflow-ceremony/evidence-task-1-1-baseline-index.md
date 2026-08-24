# Task 1.1 Baseline Index

Candidate: `reduce-workflow-ceremony-baseline-r1`
Captured: 2026-08-20
Profile: Material planning baseline; no Product Candidate mutation.

## Ownership Freeze

- Active changes at capture: `add-autonomous-roadmap-mission-runtime` 8/17, `fix-workstation-restart-reliability` 2/7, `optimize-shared-opencode-runtime-resources` 0/10, and this change 0/17.
- Existing active work owns or modifies `global/AGENTS.md`, `global/skills/change-ready-sdlc/SKILL.md`, `global/opencode.json.template`, completion-guard controller, roadmap mission sources, `package.json`, proof shared libraries, model profiles, and workstation tooling.
- This change must integrate from current bytes, never restore another writer's preimage, and serialize completion-guard/mission/config edits after recapturing ownership.
- Unrelated model-profile and workstation changes are outside this change.

## Source Identities

| Path | SHA-256 |
|---|---|
| `global/AGENTS.md` | `71aa8f5463273e76b909570ff78d3805568a5e0069bd806b27c512e3bffa2a46` |
| `global/skills/change-ready-sdlc/SKILL.md` | `b9caeddd020cbb472d44d3b100e88bfe122acf0fbad3cfa0212e22385d3843be` |
| `global/opencode.json.template` | `8783b0aa55ef40544d654b31930ffa23810d0156e7ca882e25f7ef59ef4bcacd` |
| `tools/validators/devkit-contract.ts` | `60e1ce2092f19a61c06d121a0a3421c15a1b4400db6b31975f8ae3d7a955d439` |
| `tools/doctor.ts` | `425ebc6c8669f7730cae62076b7ba9386022d787c369a6d5790433e5ec173998` |
| `tools/instruction-budget.ts` | `3c4a89db1857d8eda4c956e5e593f068c1bb7a8a86db97334b3518d416f5715f` |
| `config/instruction-budget.json` | `83462905201ec4cf1a8328866de63d132a2797eb0b4681e71b2d3e2bba1f1e93` |
| `global/extensions/session-completion-guard/runtime-support.ts` | `22d6bd9b5cd2d6f893c88c3a0bc9253e7080e5bbbf98954e2247bab96926ace3` |
| `global/extensions/session-completion-guard/controller.ts` | `92d3b7fd3e1205fe3c81aaf24b103ad3eaba1f9e08da99268c685e8b441ee0c2` |
| `global/extensions/session-completion-guard/types.ts` | `5fa3a10d2b2875c476d284b12aba9e5a82559f6ffb0d980a94b9cba229a317f7` |
| `global/bin/roadmap-mission/session-executor.ts` | `e6cc09f50164771b7c21d306577e4a147980d8cbd859fecbb0e6812f5da0e7ad` |
| `openspec/specs/library-instruction-artifacts/spec.md` | `90706f0239862dcb0606ddd08ab48d68528dbb28c2ebfbf8a3a0ef980a14bdfc` |
| `openspec/specs/library-spec-workflow-integrity/spec.md` | `f30b68d6da501b7af767d079224dc95d585479da70f37aa5ae7c6504e238ddc1` |
| `tools/proofs/pre-escalation-recovery.ts` | `2cc40169bb82899c1be34c62dd167fbb7a302227b13ae2d66aeed11fd49f7dea` |

## Baseline Facts

- Loader-visible token proxy: startup `16175`, discovery metadata `2239`, on-demand bodies `66244`; 57 measured and zero unknown sources.
- Current budget reports catalog `99947/100840` and global authority `16041/16659`, both passed. The committed target for this change is global authority `<=13279`.
- Managed compaction prompt: template digest `6e501365145e1e07d48b99aeafeb749a51a7837e5e1b05b9be2431d58c4d3957`, active digest `d21c44610488d72f45689e11f0e596bfe7126815a68ed41edcf2e515026c85ea`, status `different`; both retain `Session Reflection` and neither contains the removed pending/session-derived/six-cell markers.
- Normative contradiction: `openspec/specs/library-instruction-artifacts/spec.md` requires the final-history process while `tools/validators/devkit-contract.ts` rejects its maintained runtime markers. `npm.cmd run validate:strict` still exits `0` with `warnings=0`, proving the conflict is not currently detected.
- Kit self-doctor exits non-zero for qualification and reports false blockers `project AGENTS.md` and `project adapter validation` despite the repository-native authority and package scripts.
- Permission proof reports `mainDefault=permissive`, `specialistRestrictions=preserved`, and `hiddenArbiterTools=all-false`. The permission proof's repeated-use `--help` path currently exits non-zero and is a known proof-runner contract gap.

## Immutable Bundles

- `evidence-task-1-1-baseline-instruction-r1/`: provider-free inventory/budget raw facts and terminal evaluation (`pass=true`, cleanup passed).
- `evidence-task-1-1-baseline-doctor-r1/`: provider-free doctor/runtime-source fixture raw facts and terminal evaluation (`status=complete`, cleanup complete).
- `evidence-task-1-1-baseline-permissions-r1/`: installed loader permission raw facts and terminal evaluation (`status=complete`).
- `evidence-task-1-1-baseline-model-preflight-r1/`: provider-free route/preflight evidence for the existing instruction runner.
- `evidence-task-1-1-baseline-model-r1/`: five bounded configured-model captures: `outcome-achieved`, `owner-only`, `safe-local-route`, `checked-unmet`, and `unchanged-live-repetition`.
- `evidence-task-1-1-baseline-model-replay-r1/evaluation.json`: zero-live-call replay; all five baseline rows are complete with expected route, tool, file-effect, question, and cleanup facts.

## Failed Proof Path

The first full working-tree stage-source attempt copied machine-local config into a repository evidence tree and made strict validation scan duplicate config. The generated tree was removed without content inspection and the strategy is recorded in `history.md`. No model call or Product Candidate behavior occurred in that failed path.

Live-Attempt Gate: clear for the matched instruction baseline/candidate lane. The baseline capture and zero-live-call replay are terminal, cleanup is complete, and no repeated attempt is pending.
