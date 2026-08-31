# Task 3.1 OpenSpec And Compaction Continuity

- Candidate: `opdc-openspec-continuity-r3`
- Environment: `windows-node-24.18.1-opencode-1.18.25-openspec-source-r3`
- Result: complete at the source/provider-free boundary
- Runtime ceiling: task 2.2 configured proof remains attributable to its prior source digest; current R3 configured ordinary/OpenSpec/compaction behavior is unproved until task 3.2

## Production Contract

- OpenSpec apply appends one strategy-history entry only when a materially changed route's suppression identity is absent from existing history, updates only affected design/task/attempt/stop-line/evidence controls, and otherwise continues the existing `Next Action` with zero planning writes.
- A current or `irreducible` route creates no proposal/design/spec/task/history churn solely for reflection. A proposed outcome, proof, or population reduction remains at the existing owner boundary and parks only its dependency.
- Compaction emits one `Delivery Checkpoint State` block with exact checkpoint/evidence/route/preserved-facts/next-action/next-oracle/suppression fields. The same identity suppresses a duplicate `Pending Strategy History` entry and duplicate checkpoint/history record.
- `Next-Session Action` names the checkpoint's `Next Action`; when the live-attempt gate is also blocked or unknown, that action is the first gate-closing offline step rather than a competing process action.
- Optional Kaizen capture remains non-authorizing and cannot schedule, complete, block, or preempt the current checkpoint.

## Practice Owner Disposition

- Initial reviewer session: `ses_fab43f3cdffeFtsSMYb21uAxtX`; corrected-candidate session: `ses_fab398d6cffeqAH5AOnjGfXIeM`; Effective Model: `xai/grok-4.6`.
- `IAR-OPDC-31-01`: confirmed and closed by identity-absent history append plus already-recorded zero-write continuation.
- `IAR-OPDC-31-02`: confirmed and closed by making the checkpoint block the single continuation owner for the same suppression identity.
- `IAR-OPDC-31-03`: confirmed and closed by positively binding `Next-Session Action` to checkpoint `Next Action`.
- `IAR-OPDC-31-04`: reproduced after corrected-candidate review and closed by making the checkpoint next action the first live-gate-closing offline step when both states coexist. No additional generic re-review was launched.

## Validation

- `node tools/test-consumer-outcome.ts`: `OK: consumer outcome tests=44` after both correction rounds.
- `node tools/test-contracts.ts`: `OK: contracts tests=75` after both correction rounds.
- `npm.cmd run test:focused:instruction-context`: `OK: instruction context quality tests=15` after both correction rounds.
- Provider-free R3 materialize/replay: exit `0`; governed source digest `1b8e47c40cb632bf8de85f2e33deeb3f6dc1906f751a7076b19a213b1a026ba2`; evaluation digest `33b3af577d2acf9e4589239d85d0e349f6db6390f0e74d1915c206733ef34355`; 12 scenario greens, 12 scenario reds, 4 continuity greens, and 7 continuity reds matched exact oracles.
- Provider/model/network/process/source-write/remote effects remained zero; evidence cleanup was terminal.
