# Bounded Baseline Live-Attempt Gate

- Governed lane: `bounded-falsification-review-v1` pre-product configured baseline.
- Live-Attempt Gate: closed for the finalized full-pack r1 invocation; it is non-reusable.
- Candidate/source identity: unchanged loaded pre-product instruction digest `af9e8a56a6cca47fe071f486e79ff3c50b11b96bb917fc56f17db0c304730c6a`.
- Pack identity: `bounded-falsification-r1` / `47268f346d28a2f84ea7d7fa866dc71f26924e75ac17450a7533973c5548fc2c`.
- Preserved raw bundle: `baseline-sessions/bounded-falsification-baseline-r1/bundle.json`.
- Offline replay coverage: the full preserved bundle reproduced eleven passing members and one `material-inline-plan` proof-runner observation failure; the selected eleven-member projection passed `baseline-established` at digest `30117ed06dc99f0ba82d496f0e74f743f8dcba0c23bda8b84a3fbc563558d0b2` with no live calls.
- Terminal replay result: failed only for the original truncated `material-inline-plan` sample; cleanup was complete. This was a proof-runner evidence failure, not a Product Candidate failure.
- Unlock condition: satisfied only for one causally distinct selected-member evidence capture after the exact missing observation, line-range correction, zero-call preflight, and selected replay were recorded in `task-1-2-baseline-live-gate-r2.md`.
- Final status: the selected r2 member passed and composes with the eleven preserved r1 members for complete baseline coverage. Do not rerun or relabel the original full-pack invocation.
