# Evidence Inventory

The maintained Proof Runner is `tools/proofs/agent-tooling-ergonomics.ts` and its
complete boundary, modes, effects, cleanup, and limitations are listed in
`tools/proofs/README.md`.

Each child directory here is one create-new immutable preflight, capture,
evaluation, replay, or handoff bundle. Baseline and candidate roots are never
overwritten. Evaluator-only changes replay preserved capture roots and do not make
configured-model calls.
