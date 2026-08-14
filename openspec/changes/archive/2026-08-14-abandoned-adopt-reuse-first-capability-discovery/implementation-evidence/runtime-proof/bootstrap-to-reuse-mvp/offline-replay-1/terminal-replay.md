# Registered-Peer Failure Replay

## Preserved Bundle

- Failed live bundle: `../registered-peer/registered-peer.bundle.json`.
- Session terminal status: outer OpenCode exit `0`; semantic client result `invalid` because the one invocation used unsupported `--terms` and omitted `--groups`.
- Cleanup: session deletion `0`; disposable root removed; sanitizer completed over both JSON files.
- Product state: no source/config/dependency/remote mutation occurred.

## Offline Coverage

- Evaluator replay: `evaluation.json`; baseline complete `8/8`, eight rows emitted, candidate intentionally incomplete because this task-2.2 proof root contains only the registered-peer lane.
- Main semantic disposition: accepted-outcome defect. The lane did not query, source-verify, or select the seeded peer capability; it cannot establish MVP.
- Complete raw diagnostics inspected: assistant output, exact tool inputs/statuses, client diagnostic, token/event facts, source hashes, side-effect manifests, and cleanup.
- Sanitizer: completed over the preserved candidate bundle and manifest without another provider call.
- Corrected-candidate strict validation: green, `skills=25 agents=18 markdown=257 warnings=0 infos=2`.
- Corrected-candidate Rung 2 replay: `../../minimal-bootstrap-client/current-after-query-guidance/client-proof.json`; nine commands green, source verification present, no sentinel disclosure, cleanup removed.
- Corrected-candidate loader/permission preflight: `../preflight-after-query-guidance/preflight.json`; exact model/profile, 12-step envelope, final proof permission, credential-store availability, loader statuses, and cleanup green; model calls `0`.

## Causal Change

`global/skills/reuse-discovery/SKILL.md` now supplies the exact internal query grammar:

`query --config <absolute-file> --need <one-term> [--need <term>...] --groups <group-id> [--groups <group-id>...] --limit 10`

It explicitly forbids `--terms`, missing groups, and combined multi-term strings. User-facing `/reuse-inventory` remains free-form.

## Terminal Result

- Preserved failed-candidate verdict: red and fully explained; no missing raw observation.
- Corrected candidate offline/runtime prerequisites: green through every non-provider stage reachable for this lane.
- Why a retry can reach farther: the only failed boundary was fresh-model argv selection, and the corrected lazy skill now provides an exact accepted grammar while the same client/config/fixture/permission path is independently green.
- Live-Attempt Gate: `clear` for one fresh registered-peer retry only.
- Unlock condition for any later call: the retry must preserve a green semantic bundle and cleanup; otherwise another live attempt is blocked pending a new complete offline replay.
