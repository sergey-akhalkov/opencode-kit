# Task 2.1 Delivery Horizon Contract Evidence

- Product Candidate: `global/bin/openspec-change/delivery-horizon.ts` plus deterministic `artifact:delivery-horizon` operation-gate readback.
- Owner disposition: extend `global/bin/openspec-change` with one cohesive schema/materialization module; no second framework or semantic classifier.
- Horizon boundary: schema 1 exact fields, RFC 3339 UTC window ordering, contained regular-file references, no symlink or parent fallback, and cause-preserving failures.
- Proposal boundary: linked, `none - <reason>`, legacy-unlinked, duplicate, and malformed states are explicit; only new `propose` requires the declaration.
- Receipt boundary: create-new immutable JSON keyed only by horizon id, decision-context digest, and trigger-evidence digest. Archive identity, review timestamp, trigger label, and semantic prose are non-key metadata.
- Lifecycle correction: receipt readback validates immutable internal bytes without requiring historical reference files to remain current. Materialization still verifies current refs before write, and planned successor paths need not exist before canonical propose runs.
- Runtime Proof: `npm.cmd run test:focused:delivery-horizon` exited 0 with four matrix tests covering valid, legacy, none, missing, duplicate, malformed, contradictory, escaping, symlink, unsupported, volatile-metadata, changed-evidence, immutable-path, successor, and historical-readback cases.
- Gate Validation: `npm.cmd run test:focused:openspec-gate` exited 0 with 23 tests. The actual active apply CLI exited 0 and reported `artifact:delivery-horizon=passed` with `legacy-unlinked` for the pre-contract trajectory proposal.
- Code Health: `delivery-horizon.ts` is in the 400-799 attention band, not the split-candidate band. It remains cohesive around one contract: parsing, contained reference identity, immutable receipt materialization, and readback. The existing operation gate retained its proposal-check ownership.
- Effects/Cleanup: zero model/provider/network/Git/OpenSpec operations; only disposable fixture and create-new receipt writes; every fixture root removed.
- Claim ceiling: provider-free contract and operation-gate behavior only. No loaded skill, forecast, trajectory trigger, successor execution, or population-member behavior is supported.
