# Harvest Handoff

- **Outcome:** working
- **Supported claim:** HRAW-001 narrowed to the two maintained consumer scenarios on Windows `openai/gpt-5.6-sol` plus the snapshot CLI Git-inspection fixture. Official evaluate `passed-improvement` digest `3138aeff…` (`openspec-add-json-output` tools 20→19).
- **Runtime Proof:** `task-4-2-candidate-r3` / `task-4-2-candidate-r3-baseline`. Snapshot `--summary` schema 1.
- **Validation:** snapshot tests=11, operation-gate=16, consumer=15, validate:strict 0 warnings, instruction budget passed, `npm test` 0, `openspec validate --strict` valid.
- **External operations:** none.
- **Known Non-Critical Limitations:** one-tool median improvement only; unmeasured OS/repos; gate `--help` unsupported; r2 vs stale digest is superseded.
