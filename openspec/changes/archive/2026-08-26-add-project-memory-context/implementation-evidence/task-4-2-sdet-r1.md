# Task 4.2 Fresh Critical SDET R1

- Candidate: `29ba3b07623d31065236053e30d9d488650e900651d868b63d60b96d73aeed8b`.
- Loaded boundary: `task-4-1-loaded-r2`, runner `98ca133f9b280b4c96661fc57f2a5d6e53a5334d629a2ada2ca4713535acfc6c`, OpenCode `1.18.23`.
- Fresh test-only SDET session: `ses_fc4f7a19fffeYMB4PCzRXBdAuk`; effective model `xai/grok-4.6`; production, configuration, OpenSpec, and evidence writes were forbidden.
- SDET terminal state: `no-critical-risk`.
- Retained unique oracles: `tools/test-project-memory.ts` now proves two distinct canonical Git roots sharing one `OPENCODE_DATA_DIR` receive distinct project/store refs, recall only their own records, and disclose neither root. `tools/test-project-memory-hooks.ts` now proves an evidence fingerprint change immediately before system transform drops the cached card, restoring bytes without a new message does not synthesize selection, a new message can reselect it, and second-process invalidation then drops it again.
- First execution: `node tools/test-project-memory.ts && node tools/test-project-memory-hooks.ts && npm run test:focused:project-memory`; exit `1`. The new cross-project oracle passed. The chain stopped at a test-only sequencing defect that expected a dropped ref to reappear after restoring evidence without a new `chat.message`; the fingerprint-mismatch fail-closed assertion itself had passed. No Product Candidate defect was inferred.
- Corrected execution: the same exact command exited `0`. Direct project-memory tests reported `9/9` pass, hook tests reported `1/1` pass, and the package focused command repeated both suites green.

## Main Disposition

| Risk | Independent reproduction and evidence | Disposition |
| --- | --- | --- |
| `PMC-SDET-1-leakage` | Supported credential, home, native/slash project-root, persistence, tool, capsule, warning, and loaded-provider probes passed. A scoped search of the selected `capture.json`, `raw.json`, and `evaluation.json` found none of the seeded credential or host paths; loaded `privacyRedacted=true`. | Not reproduced in the supported envelope; no critical defect. |
| `PMC-SDET-2-cross-project` | The fresh shared-data-root test passed in both the direct and package-focused executions. `resolveProjectMemoryStore` derives `projectRef` from the canonical root and nests the store under that ref. | Not reproduced; unique regression retained. |
| `PMC-SDET-3-root-isolation` | Provider-free root/child/missing/mismatched/outside/timeout cases passed. `verifiedRoot` rejects mismatched IDs, parent sessions, invalid directories, and lookup failure. Loaded R2 independently records `subagentExcluded=true`. | Not reproduced in provider-free and loaded boundaries; no critical defect. |
| `PMC-SDET-4-stale-context` | Fresh fingerprint-before-transform, second-process transform/compaction invalidation, candidate/stale/mismatch exclusions, and loaded `systemRevalidation`/`compactionRevalidation` all passed. Source inspection confirms revalidation selects only still-eligible existing refs and deletes empty session selection. | Not reproduced; unique fingerprint regression retained. |

- Residual limitations: loaded stdout/stderr is intentionally privacy-redacted rather than retained raw, and provider-free session lookup uses a mock. The loaded provider capture covers the real child, invalidation, and privacy paths. These are evidence-boundary limits, not reproduced critical incidents.
- Claim ceiling: the four named critical hypotheses have terminal `no-critical-risk` evidence for this candidate and environment. Complete `PMC-001` population closure still awaits candidate freeze, member observation binding, and the separate fresh evidence-sufficiency challenge required by task `4.3`.
