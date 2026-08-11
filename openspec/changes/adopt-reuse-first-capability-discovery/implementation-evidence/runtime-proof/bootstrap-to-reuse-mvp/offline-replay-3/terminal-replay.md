# Selected-Source Access Replay

## Preserved Bundle

- Candidate bundle: `../registered-peer-final/registered-peer.bundle.json`.
- Query: green; exact result `text/jsonc-parse`; committed entrypoint/evidence presence verified.
- Semantic verdict: red because selected source/evidence reads were denied outside the workspace, so the model correctly retained reuse as blocked.
- Cleanup: session deletion `0`, disposable root removed, bundle/manifest sanitized.
- Offline evaluator: baseline complete `8/8`, all rows emitted, task-local candidate intentionally incomplete.

## Distinct Mechanism And Current Proof

The proof fixture now places only the explicitly selected Alpha/Beta repositories under the disposable workspace. The unselected sentinel remains outside it. No external-directory permission is broadened.

The Alpha source now implements string-aware line/block comment removal, trailing-comma removal, BOM handling, native JSON decoding, and explicit unterminated-block-comment rejection. Its committed `proof-jsonc.ts` invokes three representative cases. `../readable-selected-source-final/client-proof.json` records:

- producer proof exit `0`, stdout `{"status":"ok","cases":3}`, empty stderr;
- bootstrap of exact selected commits/trees;
- empty-before-promotion, pending, sync, and curated-after lifecycle;
- explicit and exact-single-enabled query paths;
- committed-source verification `verified`;
- sentinel absence and clean producer Git states;
- ten client commands exit `0`;
- cleanup `removed`, model calls `0`.

Corrected-candidate strict validation is green. `../preflight-readable-source/preflight.json` records current runner/product hashes, exact model/profile, bounded final permission, 12-step envelope, loader statuses, credential-store availability, and cleanup.

## Terminal Result

- Prior bundle: fully replayed red with no missing raw observations.
- Corrected selected-source/client boundary: green at Rung 2 with direct producer runtime evidence.
- Why another call can reach farther: selected committed source and proof are now ordinary readable workspace files; no external-directory permission or sentinel access is needed.
- Live-Attempt Gate: `clear` for one final registered-peer candidate call.
- Stop condition: any semantic or cleanup failure ends provider retries for task 2.2; continue only provider-free/local work or report the exact blocker.
