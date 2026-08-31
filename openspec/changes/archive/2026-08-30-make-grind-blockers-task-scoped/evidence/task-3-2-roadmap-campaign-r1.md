# Task 3.2 Roadmap And Campaign Composition Evidence R1

## Outcome

- Task: `3.2`
- Result: `complete` at the provider-free roadmap/campaign composition boundary only.
- Integrated candidate: `grind-task-scoped-roadmap-campaign-r1`
- Roadmap candidate: `grind-roadmap-worker-r16`
- Campaign candidate: `grind-campaign-worker-r7`
- Environment: `windows-node-24.18.1-provider-free-roadmap-campaign-r1`
- Installed OpenCode proof: not run and not implied; tasks `4.1` and `4.2` remain the installed boundaries.
- Claim disposition: `GRIND-TSB-001` remains `unknown` with `0/20` installed population observations.

## Ownership And Behavior

- The existing roadmap mission ledger remains the sole wave scheduler and source writer. The existing campaign ledger consumes terminal roadmap handoffs; no second scheduler, parser, or ledger was added.
- Roadmap parent handoffs project disjoint `completedWorkItemRefs` and `blockedWorkItemRefs` subsets of the frozen wave. Missing legacy fields default completed refs only for a complete parent and blocked refs from the selected blocker.
- Product-decision and non-product waiting blockers park only their affected slices. Every dependency-valid, non-overlapping sibling drains before the terminal handoff. Dependent siblings do not launch.
- Campaign consumption accepts a legal empty completed set when blocked refs are non-empty. Blocked and dependent items remain unresolved, no archive/checkpoint or source marker is invented, and durable report claims match the actual completed count.
- Campaign investigation carries a structured `MissionBlocker | null`. `product-decision-required` and `waiting` require correlated blocker evidence; legacy `owner-required` maps to waiting rather than a product choice.
- Repeated campaign resume is exact-once for the consumed scoped handoff.

## Observable Proof

- Roadmap controller bundle `evidence/roadmap-controller-r16` -> `status=complete`; parent handoff and scoped scheduling checks are true.
- Roadmap replay `evidence/roadmap-controller-replay-r16` -> `status=complete`, evaluator-only.
- Roadmap state bundle `evidence/roadmap-state-r16` -> `status=complete`.
- Campaign controller bundle `evidence/campaign-controller-r7` -> `status=complete`, `processStarts=125`, all checks true, including `scopedMissionStopsProjected`.
- Campaign replay `evidence/campaign-controller-replay-r7` -> `status=complete`; the replay command emitted `liveCalls=0`.
- Campaign fixtures cover product-decision plus independent sibling, waiting plus independent sibling, and product-decision with only a dependent sibling. The blocked-only case asserts zero sibling archive/checkpoint/source marker, unchanged item status, and report prose that claims no completion.

## Validation

- `npm run test:focused:work-campaign` -> exit `0`; proof-contract/materializer/state, provider-free controller, semantic executor, semantic playbook, and supervisor suites all pass.
- `npm run proof:work-campaign -- --mode controller --candidate-id grind-campaign-worker-r7 --environment-id windows-node-24-provider-free-r7 --evidence-root <create-new-campaign-r7>` -> exit `0`, `processStarts=125`, `status=complete`.
- `npm run proof:work-campaign -- --mode replay --candidate-id grind-campaign-worker-r7 --environment-id windows-node-24-provider-free-r7 --input-root <campaign-r7> --evidence-root <create-new-campaign-r7-replay>` -> exit `0`, command output `liveCalls=0`, `status=complete`.
- Prior roadmap commands captured `grind-roadmap-worker-r16` controller, replay, and state bundles with `status=complete`.

## Architecture Challenge And Main Disposition

- Initial architecture review `ses_fb03b5b77ffeYwEPKkNB2UXLpo` found `ARCH-TSB-32-001`: empty completed refs were rejected and investigation still collapsed product/wait outcomes. Main reproduced both and corrected the current source.
- Corrected-candidate review `ses_fb001438dfferU4YxFXQ76HQKT`, Effective Model `xai/grok-4.6`, confirmed both `ARCH-TSB-32-001` subparts closed in source/tests and found `ARCH-TSB-32-002`: blocked-only report prose falsely claimed sibling completion/checkpointing.
- Main reproduced `ARCH-TSB-32-002`, made report summaries derive from completed refs and checkpoint evidence, added a claim-to-effects fixture oracle, and recaptured r6.
- Reviewer bundle access was unavailable in its workspace-confined runtime (`ARCH-TSB-32-003`); main independently read r5/r6 and current r7 bundles and verified current source identity through the capture evaluator and offline replay.

## Proof-Runner Diagnostics

- Campaign r3 failed closed at the former 180-second internal capture limit without preserving the spawn error.
- Campaign r4 preserved the exact `ETIMEDOUT` cause at 240 seconds. A checkpointed diagnostic showed all three scoped fixtures completed normally; the expanded full controller was the long-running boundary.
- The maintained controller capture now uses a 300-second internal bound inside a larger caller window and preserves `spawnSync` errors. Missing or timed-out raw capture still evaluates blocked.
- Campaign r5 completed before the final report-claim correction; r6 captured that correction before the code-quality reduction; r7 is the current campaign bundle.

## Code Quality Disposition

- Fresh reduction review `ses_fafe52152ffe9KhRFeoPR38fgR`, Effective Model `xai/grok-4.6`, found one duplicated terminal-status expression in the semantic playbook. The current candidate computes it once for no-wave and synthesized-wave returns without changing the distinct item mappings or retained product/wait oracles.
- A medium-confidence fixture setup shortcut was not applied because clone-source boundary identity is not asserted and the change would remove no concepts. The three isolated product, wait, and blocked-only fixtures and their unique effect/report oracles remain intact.
- `global/bin/work-campaign/controller.ts`, `tools/test-work-campaign-controller.ts`, and `tools/proofs/work-campaign.ts` remain split-or-justify candidates by size, but task 3.2 extends their existing campaign-ledger transition, composed-fixture, and evaluator responsibilities. Extracting the scoped consumer/evaluator now would add a navigation layer or duplicate policy without creating a distinct owner.

## External Effects And Cleanup

- Provider/model calls: `0`.
- OpenCode install, activation, start, or restart: `0`.
- Remote, protected, release, deployment, commit, or push effects: `0`.
- Disposable controller processes and fixture roots closed with cleanup complete. No proof-owned writer remains.

## Claim Ceiling And Next Boundary

This evidence supports current provider-free roadmap r16 scheduling and campaign r7 handoff consumption, scoped product/wait persistence, restart idempotence, and accurate blocked-only report projection through task `3.2`. It does not prove the installed main/arbiter/question lifecycle, installed roadmap/campaign composition, authorization containment, compaction behavior, any `GRIND-TSB-001` installed population member, SDET, validation closure, or archive readiness. The next real boundary is the bounded installed task `4.1` capture under the existing unknown Live-Attempt Gate.
