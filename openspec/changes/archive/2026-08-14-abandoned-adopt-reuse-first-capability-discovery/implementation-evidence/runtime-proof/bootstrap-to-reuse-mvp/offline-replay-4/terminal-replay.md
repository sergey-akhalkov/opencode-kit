# Exact Vocabulary Terminal Replay

## Preserved Live Result

- Bundle: `../registered-peer-readable-final/registered-peer.bundle.json`.
- Outer exit: `0`.
- Client call: valid one-call query using `--need jsonc-parsing --limit 10`.
- Semantic result: zero matches because exact terms were `jsonc` and `parsing`, while the synthetic curated record omitted `parsing`.
- Product effects: none; no source/dependency/remote mutation.
- Cleanup: session deletion `0`, root removed, bundle and manifest sanitized.
- Offline evaluator: baseline complete `8/8`, all rows emitted, task-local candidate intentionally incomplete.

## Provider-Free Correction

The synthetic capability and pending candidate now include sorted explicit keyword `parsing`; exact query semantics remain unchanged. `../captured-vocabulary-final/client-proof.json` replays the captured vocabulary through the actual client and records:

- direct producer proof exit `0`, three cases;
- exact selected commits/trees and clean Git states;
- eleven commands exit `0`;
- `query --need jsonc-parsing --limit 10` resolves sole enabled group `personal`;
- exactly one curated result, `text/jsonc-parse`;
- committed-source verification `verified`;
- unselected sentinel absent;
- complete registry validation and cleanup green;
- model calls `0`.

`npm run validate:strict` is green: `skills=25 agents=18 markdown=260 warnings=0 infos=2`. Runner syntax check is green.

## Terminal Result

- Current deterministic client/source/privacy/cleanup candidate: green.
- Current same-model registered-peer result: no single green bundle after four bounded attempts; task 2.2 cannot claim MVP.
- Live-Attempt Gate: `blocked`.
- Failure Chain: unsupported `--terms` -> dangling invented group environment -> selected source outside readable workspace -> exact vocabulary omitted `parsing`.
- Preserved Raw Bundles: `../registered-peer/`, `../registered-peer-retry-1/`, `../registered-peer-final/`, and `../registered-peer-readable-final/`.
- Offline Replay Coverage: each failed bundle evaluated and sanitized; exact failing argv/vocabulary replayed through current client; strict validation, current loader preflight, producer proof, privacy, validation, and cleanup green.
- Terminal Replay Result: green for every current provider-free stage; no current same-model semantic bundle exists.
- Unlock Condition: do not repeat the direct-prompt provider strategy in task 2.2. A later provider attempt requires a separately justified materially different workflow beyond this consumed stop condition and must preserve these bundles; compaction, restart, or candidate rename does not clear the gate.
