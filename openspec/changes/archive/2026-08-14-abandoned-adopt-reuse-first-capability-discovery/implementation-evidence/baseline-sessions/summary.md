# Baseline Same-Model Capture

Captured: 2026-08-10

## Accepted Baseline Identity

- Final comparable bundles: `capture-4/*.bundle.json`.
- Final offline facts replay: `capture-4-evaluation-final/evaluation.json`.
- Preflight: `preflight-4/preflight.json`.
- Profile: `quality-independent`.
- Agent route: `build`, `openai/gpt-5.6-sol`, variant `xhigh`.
- Capture Runner SHA-256: `90994831efc84cb06d5bba868125ea3e00ad4c10f1d7265d6f230bfd0d0a75d4`.
- Privacy-sanitizer/evaluator source after the capture-only username redaction: `854be572c0c88c17132c8653b830aa73ba2b862f72d67f4de372be133724e501`.
- Candidate identity: `baseline-35f5f351`; loaded command, lazy reuse skill, and deterministic registry client were absent in every bundle source hash.
- Final inline proof envelope: exact resolved permission map, literal canonical registry entrypoint only, shell metacharacters denied last, and `build.steps: 12`.

Direct `opencode run` is retained instead of the SDK session helper because the boundary under test is a fresh primary process loading the real global instruction/command catalog. JSON events expose tool/token/time facts; every event-correlated session is then deleted explicitly through the same data store. The existing shared proof-client ownership remains the source for SDK-routed hidden-agent proofs and was not duplicated.

## Preflight

- Model calls: `0`.
- Exact final permission policy: `true`.
- Agent step limit: `12`.
- Config loader status: `0`; no loader error.
- Agent loader status: `0`; no loader error.
- Existing credential count: `4`; values and provider names were not captured.
- Isolated-data credential count: `0`; this preserved fact explains the rejected first provider attempt.
- Disposable fixture cleanup: `removed`.

## Final Scenario Facts

| Scenario | Process / session delete / root cleanup | Elapsed | Baseline observation |
| --- | --- | ---: | --- |
| `inventory-refresh` | `0 / 0 / true` | 154,113ms | Canonical client absent; registry/project resolution blocked; strict-JSON source candidate withheld rather than published. |
| `local-owner` | `0 / 0 / true` | 123,134ms | Found the local `parseJsonc` seam but chose a new handwritten scanner plan rather than an explicit `reuse` disposition. |
| `registered-peer` | `0 / 0 / true` | 115,289ms | One canonical client attempt; missing module produced explicit blocked cross-project evidence and no private-source read. |
| `stale-record` | `0 / 0 / true` | 93,803ms | One canonical attempt; missing module prevented catalog/source selection, so stale verification behavior is absent from baseline. |
| `typical-external` | `0 / 0 / true` | 100,211ms | Suggested built-in `node:util.parseArgs` after local evidence, recorded remote/package evidence unavailable, and made no install. |
| `no-match` | `0 / 0 / true` | 78,499ms | Kept behavior inline in the future fixture consumer and rejected a reusable API; no file was invented. |
| `trivial-fix` | `0 / 0 / true` | 52,502ms | Read only local task/source, proposed one punctuation edit and direct proof, with zero registry/skill calls. |
| `registry-unavailable` | `0 / 0 / true` | 81,443ms | Recorded blocked cross-project evidence but proposed an external dependency and left registration `unknown/blocked`. |

Every bundle preserves the exact prompt, argv, status, redacted stdout/stderr, event stream, assistant output, tool inputs/statuses, token/cache facts, elapsed time, before/after file hashes, and cleanup. OpenCode exposed cost values as `0` and did not expose a model ID in message events; the exact route is established by the committed profile, explicit invocation, and loader preflight.

## Side Effects And Privacy

- Product/project source was not edited. Canonical registry calls failed before client code existed.
- OpenCode/Serena could create disposable `.serena` metadata inside the workspace; before/after manifests preserve it and root cleanup removed it.
- No dependency, network, clone, fetch, pull, commit, push, owner registry, or remote effect occurred during model sessions. Fixture Git commits were runner setup only.
- Final privacy scan found no owner username, absolute reuse-discovery temp root, or `SENTINEL_UNALLOWLISTED` disclosure in `capture-4`.
- Raw diagnostic attempts remain under `baseline-sessions/` but are not comparable baseline rows. Strategy and retry decisions are in `history.md`.

## Failed-Attempt Disposition

- Initial isolated-data attempt: missing credential store caused one generic server error. Preserved bundle reached terminal offline replay.
- Interrupted broad-tool attempt: three bundles exposed that later global `permission: allow` overrode project config; exact stale-session recovery deleted session/root and offline replay consumed the three bundles.
- Substring bash permission attempt: `node -e ... reuse-registry` bypass proved the pattern unsafe; those bundles are diagnostic only.
- Final mechanism: final inline exact permission plus literal entrypoint and 12-step envelope. No strategy is repeated without its recorded retry condition.

## Validation

- `node --check tools/proofs/reuse-discovery.ts`: exit `0`, no output.
- `npm run validate:strict`: exit `0`; `skills=24 agents=18 markdown=252 warnings=0 infos=2`.
- Final evaluator: `baselineComplete: true`, `rows: 8`, no synthetic quality score.
- Serena diagnostics cannot resolve `node:` declarations or `NodeJS` globals because its standalone TypeScript environment lacks Node types; executable Node and repository-native validation are green.
- Live-Attempt Gate: `clear` for later candidate capture. No open provider process, proof session, or disposable root remains.
