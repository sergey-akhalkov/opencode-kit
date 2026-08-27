# Material-Inline Baseline Evidence Capture Gate R2

- Governed lane: `bounded-falsification-review-v1/material-inline-plan` pre-product baseline.
- Live-Attempt Gate: clear for this member only; the finalized full-pack r1 invocation remains non-reusable.
- Product/source identity: unchanged `af9e8a56a6cca47fe071f486e79ff3c50b11b96bb917fc56f17db0c304730c6a`.
- Failure chain: full baseline r1 passed 11 members; the Material-inline model read the entire shared fixture, causing the 65,536-byte command evidence slice to truncate its final write event, and the checker rejected a baseline state it could not represent. Cleanup was complete.
- Preserved raw bundle: `baseline-sessions/bounded-falsification-baseline-r1/bundle.json`.
- Terminal replay result: full preserved replay reproduced only `material-inline-plan` `proof.exitCode` and `malformed-observation`; no live calls. The selected eleven-member replay then passed `baseline-established` with digest `30117ed06dc99f0ba82d496f0e74f743f8dcba0c23bda8b84a3fbc563558d0b2`.
- Causal correction: only the Material-inline request now reads its exact fixture line range; its reviewed baseline seed represents the already-existing early Material readiness observation without claiming bounded candidate behavior; bounded scenario subset selection preserves the eleven valid members.
- Offline coverage: selected preflight passed with zero calls at digest `75a0c01a913ad77201875766d7c5f70d398f51813b707e9cb939fb31d250a877`; the 32-test focused suite passed, including checker/readback and terminal evaluator replay.
- Unlock condition: satisfied because the exact missing raw observation is one non-truncated checked `material-inline-plan` decision under the unchanged product source identity.
- Invocation bound: one selected primary configured request, at most one existing readiness child, local fixture read/write only, complete cleanup required.
- Do not repeat: any failure or cleanup uncertainty blocks another equivalent selected call until this new raw bundle reaches terminal offline replay.
