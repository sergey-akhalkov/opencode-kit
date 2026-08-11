# Final Validation

## Candidate

- Candidate ID: `dedup-candidate-1`.
- Stable Candidate: `RC1` after this validation and handoff.
- Product Candidate hashes are preserved in `final-candidate-preflight/preflight.json` and `final-runtime-proof/exact-clone.bundle.json`.
- Proof Runner hash: `04b2716ad97b61664f9ef6a65fa76e3ec744df0994ad764ea3bbe9b39aa87784`.
- Environment: OpenCode `1.18.16`, Node `24.18.0`, npm `11.13.0`, route `openai/gpt-5.6-sol/xhigh`, reviewer/SDET route `xai/grok-4.5`, `jscpd` output `cpd 5.0.14`.

## Commands And Results

| Check | Result |
|---|---|
| `node tools/test-contracts.ts` | Exit `0`; six dedup tests green; `OK: contracts tests=62`; stderr empty. |
| `node tools/proofs/deduplication-audit.ts --mode evaluate ...` over the original corpus | Expected exit `1`; complete corpus with `candidateOraclesPass=false`, proving the evaluator catches the two original fixture mismatches. |
| The same evaluator with corrected baseline/candidate override roots | Exit `0`; `baselineComplete=true`, `candidateComplete=true`, `candidateOraclesPass=true`. |
| `npm run validate:strict` | Exit `0`; post-handoff validation reports `OK: skills=26 agents=18 markdown=276 warnings=0 infos=2`. |
| `npm test` | Exit `0`; all 11 repository test entrypoints green. |
| `npm run openspec:validate` | Exit `0`; 11 OpenSpec changes/specs passed, 0 failed. |
| `openspec validate add-global-deduplication-audit --strict` | Exit `0`; change valid. |
| `npm run prepush:validate` | Exit `0`; repository validation, full tests, OpenSpec validation, and final `Pre-push validation passed.` |
| `jscpd --version` | Exit `0`; `cpd 5.0.14`. |
| `npm list --global jscpd --depth=0 --json` | Exit `0`; `jscpd` version `5.0.14`. |
| Final provider-free loader preflight | Exit `0`; exact permission, skill discovered, route/credentials available, cleanup removed. |
| Final provider-free CLI proof | Exit `0`; controlled clone and bounded `tools/validators` scan green, ignored locations absent, source unchanged, cleanup removed. |
| Final exact `/dedup src` Runtime Proof | Exit `0`; skill/CLI/reviewer invoked, exact clone and canonical owner reported, source unchanged, session/root cleanup green. |

The planned command `npm run openspec:gate -- --operation prepush` returned exit `1` with `Unknown OpenSpec operation prepush`. The deterministic operation registry does not define that operation. This was a task-command defect, not Product Candidate behavior; the supported repository-native `npm run prepush:validate` ran through its terminal result and passed.

## Absence And Scope Checks

- `package.json` and repository lockfile inventory contain no `jscpd` dependency.
- No `global/agents/deduplicator.md` exists.
- No kit-global, host-default OpenCode, Claude, or existing Agents skill source contains `jscpd` or `dry-refactoring`; `%USERPROFILE%\.agents` itself is absent.
- `OPENCODE_CONFIG_DIR` resolves to this repository's `global/` source, where `deduplication-audit` and `/dedup` are installed for every repository opened by this user after OpenCode restart.
- Final scans never pass `--no-gitignore`, use explicit generated/vendor/build/cache/coverage/output/dependency exclusions, and write no target report/config/source.

## Live-Attempt Gate

- State: `clear`.
- Failure chain 1: first CLI evaluator assumed `src/`-prefixed AI reporter paths. Raw bundle preserved at `cli-proof/`; corrected evaluator/invocation proof is green at `cli-proof-attempt-2/` and `final-cli-proof/`.
- Failure chain 2: first bundle redaction did not cover JSON-escaped paths. Provider-free sanitizer replay removed username/temp roots from the preserved corpus; final bundles are privacy-safe.
- Failure chain 3: first local-owner and near-clone fixtures could not produce the named observations. Terminal original replay is expected-red; provider-free real `jscpd` scenario preflight proved corrected fixture shapes; only the two matching baseline/candidate scenarios were recaptured; terminal composed replay is green.
- Preserved Raw Bundles: all original and corrected roots remain under `implementation-evidence/`.
- Offline Replay Coverage: complete six-scenario corpus, privacy sanitation, explicit oracles, negative original corpus, corrected overrides, and terminal final evaluator.
- Terminal Replay Result: green with `candidateOraclesPass=true`.
- Unlock Condition: satisfied; no further live attempt is required.

## Worktree

No commit, push, archive, release, or remote VCS mutation was performed. The worktree contains unrelated pre-existing/parallel changes, including the active reuse-first change and archived-change movement; they were not reverted, staged, or modified for deduplication except the explicitly additive README/profile entries.
