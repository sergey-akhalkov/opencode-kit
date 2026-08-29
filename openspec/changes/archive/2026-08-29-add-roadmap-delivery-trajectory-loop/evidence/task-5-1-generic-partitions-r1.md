# Task 5.1 Generic Partition Evidence

- Candidate: `roadmap-delivery-trajectory-routing-r5`
- Governed provider-free source digest: `8c71074871bb6e0fadc58d8b6e141ba220bc32daf1476c57a7342dc01c368700`
- Reviewed seed digest: `599ce034ddab8b074bf84e5a7fe1d348f5f29a8d5ff0063ffc1f6a85523041a9`
- Baseline bundle digest: `bd292e634ea2613aedda962f938cf9f89f68e1885891e7380febd2d21df2151b`
- Candidate bundle digest: `a0b8cc717c9042510763f99c0caa52fbb929144e18d9d8c94002adfb58dda046`
- Evaluator: `passed`, digest `0ef9c466df3899b6d92d68328d607ca4f32351f116ef0d10b53a0c04c8692cac`; all 13 baseline and 13 candidate contract rows passed with zero live/model/provider calls.
- Provider-free replay A/B sha256: `a7860194547125d7bd34cf2dd3741730d6d11c695cbd4d5ccd1a0d2728bf5b3c`.
- Exact semantic observations: `explicit-horizon-within-window`, `repeated-item-touch-trigger`, and `outcome-preserving-successor` are bounded by the two configured diagnostics; `default-core-availability` is bounded separately by the generated `core`/`all` r5 loader evidence.
- Explicit unknowns: `legacy-or-unlinked-archive`, `shared-owner-fan-out-trigger`, `forecast-outside-window`, `missing-window-or-measurement`, `external-linear-bottleneck`, `quality-weakening-owner-boundary`, `unchanged-trigger-no-duplicate`, `signal-failure-after-successful-archive`, and `missing-capability`.
- Structural source checks retain the reviewed unknown/owner/fallback/duplicate contracts, but they do not promote any unknown member to a semantic observation.
- Maximum supported claim: current provider-free contract availability for all 13 reviewed members plus exact configured behavior for the four named members in the exercised Windows/OpenCode environment. No remaining member, universal trigger, forecast accuracy, or cross-project population claim is supported.
